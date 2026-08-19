import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { obtenerSemanaIso, rangoSemanaIso } from "@/shared/domain/semana-iso";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { ProgresoMetaSemanal } from "@/modules/metas-semanales/domain/progreso-meta-semanal";

export interface ObtenerProgresoMetasSemanalesInput {
  empresaId: string;
  /** Semana a consultar — cualquier fecha DENTRO de esa semana ISO. Default: ahora (semana actual). */
  fecha?: Date;
}

/**
 * Progreso semanal de TODOS los clientes que tienen `metaCabezasSemanales`
 * configurada (ver `domain/cliente.ts`) — los que no la tienen ni siquiera
 * se calculan, no aportan nada a esta vista.
 *
 * Cuenta cabezas con el MISMO criterio que `modules/planificacion-cabezas`
 * (garrones distintos vendidos en el rango, sin contar `compensacion_kg` ni
 * ventas sin garrón) para que "cuántas cabezas lleva esta semana" sea un solo
 * número consistente en toda la app, no dos cuentas que puedan divergir.
 */
@injectable()
export class ObtenerProgresoMetasSemanales {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
  ) {}

  async execute(input: ObtenerProgresoMetasSemanalesInput): Promise<ProgresoMetaSemanal[]> {
    const clientes = await this.clienteRepository.list(input.empresaId);
    const clientesConMeta = clientes.filter(
      (c) => c.metaCabezasSemanales !== null && c.metaCabezasSemanales > 0,
    );
    if (clientesConMeta.length === 0) return [];

    const semanaIso = obtenerSemanaIso(input.fecha ?? new Date());
    const { desde, hasta } = rangoSemanaIso(semanaIso);
    // `hasta` de `rangoSemanaIso` es EXCLUSIVE (el lunes siguiente), pero
    // `VentaRepository.listByEmpresaYRango` usa `BETWEEN` (inclusive en los
    // dos extremos) — se resta 1ms para no colarse al lunes de la semana
    // que viene.
    const hastaInclusive = new Date(hasta.getTime() - 1);

    const ventas = await this.ventaRepository.listByEmpresaYRango(input.empresaId, desde, hastaInclusive);

    const garronesPorCliente = new Map<string, Set<number>>();
    for (const venta of ventas) {
      if (venta.formaVenta === FormaVenta.COMPENSACION_KG || venta.garron === null) continue;
      if (!garronesPorCliente.has(venta.clienteId)) {
        garronesPorCliente.set(venta.clienteId, new Set());
      }
      garronesPorCliente.get(venta.clienteId)?.add(venta.garron);
    }

    return clientesConMeta.map((cliente) => {
      const meta = cliente.metaCabezasSemanales as number;
      const cabezasCompradas = garronesPorCliente.get(cliente.id)?.size ?? 0;
      return {
        clienteId: cliente.id,
        anio: semanaIso.anio,
        semana: semanaIso.semana,
        fechaDesde: desde,
        fechaHasta: hastaInclusive,
        metaCabezasSemanales: meta,
        cabezasCompradas,
        cumplida: cabezasCompradas >= meta,
      };
    });
  }
}
