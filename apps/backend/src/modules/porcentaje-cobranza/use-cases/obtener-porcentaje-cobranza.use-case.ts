import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import {
  calcularPorcentajeCobranzaCliente,
  MovimientoCobranza,
} from "@/modules/porcentaje-cobranza/domain/calcular-porcentaje-cobranza";
import { PorcentajeCobranzaCliente } from "@/modules/porcentaje-cobranza/domain/porcentaje-cobranza";

export interface ObtenerPorcentajeCobranzaInput {
  empresaId: string;
  anio: number;
}

/**
 * Tipos de cargo que restan del `% Cobr.` semanal — hoy solo los ligados a
 * cheques (recargo por cheque a más de 7 días, comisión por rechazo).
 * `TipoCargo.OTRO` queda AFUERA a propósito: es un cajón de sastre para
 * ajustes puntuales de administración/contable y todavía no está definido
 * si todos esos ajustes deberían contar como "cobranza floja" — pendiente
 * de confirmar. Sumarlo después es agregar `TipoCargo.OTRO` a esta lista.
 */
const TIPOS_CARGO_QUE_RESTAN_COBRANZA: readonly TipoCargo[] = [TipoCargo.RECARGO_CHEQUE, TipoCargo.COMISION_RECHAZO];

function agruparPor<T>(items: T[], clienteIdDe: (item: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of items) {
    const clienteId = clienteIdDe(item);
    const arr = mapa.get(clienteId) ?? [];
    arr.push(item);
    mapa.set(clienteId, arr);
  }
  return mapa;
}

/**
 * `% de cobranza de deuda vencida` de TODOS los clientes activos de la
 * empresa, semana a semana (ISO) de un año puntual — ver
 * `domain/calcular-porcentaje-cobranza.ts` para el algoritmo completo.
 *
 * Trae boletas/ventas/cobros/cargos de TODA la empresa de una sola vez
 * (mismo criterio que `ObtenerSaldosClientes`) y agrupa en memoria por
 * `clienteId`, para no hacer N consultas.
 */
@injectable()
export class ObtenerPorcentajeCobranza {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: ObtenerPorcentajeCobranzaInput): Promise<PorcentajeCobranzaCliente[]> {
    const [clientes, boletas, ventas, cobros, cargos] = await Promise.all([
      this.clienteRepository.list(input.empresaId),
      this.boletaRepository.list(input.empresaId),
      this.ventaRepository.list(input.empresaId),
      this.cobroRepository.list(input.empresaId),
      this.cargoCuentaCorrienteRepository.list(input.empresaId),
    ]);

    const ventasPorBoleta = agruparPor(
      ventas.filter((v): v is Venta & { boletaId: string } => v.boletaId !== null),
      (v) => v.boletaId,
    );

    const boletasPorCliente = new Map<string, MovimientoCobranza[]>();
    for (const boleta of boletas) {
      if (!boleta.activo) continue;
      const { facturada, monto } = calcularMontoBoleta(ventasPorBoleta.get(boleta.id) ?? []);
      if (!facturada) continue;
      const arr = boletasPorCliente.get(boleta.clienteId) ?? [];
      arr.push({ fecha: boleta.fecha, monto });
      boletasPorCliente.set(boleta.clienteId, arr);
    }

    const cobrosPorCliente = new Map<string, MovimientoCobranza[]>();
    for (const cobro of cobros) {
      if (!cobro.activo) continue;
      const monto = cobro.lineas.reduce((acc, l) => acc + l.monto, 0);
      const arr = cobrosPorCliente.get(cobro.clienteId) ?? [];
      arr.push({ fecha: cobro.fecha, monto });
      cobrosPorCliente.set(cobro.clienteId, arr);
    }

    const cargosPorCliente = new Map<string, MovimientoCobranza[]>();
    for (const cargo of cargos) {
      if (!cargo.activo || !TIPOS_CARGO_QUE_RESTAN_COBRANZA.includes(cargo.tipo)) continue;
      const arr = cargosPorCliente.get(cargo.clienteId) ?? [];
      arr.push({ fecha: cargo.fecha, monto: cargo.monto });
      cargosPorCliente.set(cargo.clienteId, arr);
    }

    return clientes
      .filter((c) => c.activo)
      .map((cliente) =>
        calcularPorcentajeCobranzaCliente(
          cliente.id,
          input.anio,
          boletasPorCliente.get(cliente.id) ?? [],
          cobrosPorCliente.get(cliente.id) ?? [],
          cargosPorCliente.get(cliente.id) ?? [],
        ),
      );
  }
}
