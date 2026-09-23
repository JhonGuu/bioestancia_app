import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { ListPlanificacionCabezas } from "@/modules/planificacion-cabezas/use-cases/list-planificacion-cabezas.use-case";
import {
  LineaReparto,
  RepartoDiario,
  VENTANA_HABITUALES_DIAS,
} from "@/modules/planificacion-cabezas/domain/reparto-diario";

export interface ObtenerRepartoDiarioInput {
  empresaId: string;
  /** Día del reparto. Llega de "YYYY-MM-DD" (medianoche UTC, ver `z.coerce.date()`). */
  fecha: Date;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function aClaveDeDia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Arma el reparto de un día a partir del plan de cabezas ya cargado:
 *
 * - `lineas`: clientes con cabezas planificadas > 0 ese día, con su
 *   aclaración (`comentarios`), en orden alfabético.
 * - `noLlevan`: clientes activos que llevaron cabezas en las últimas 4
 *   semanas pero ese día tienen 0 (ver `RepartoDiario.noLlevan`).
 *
 * Reusa `ListPlanificacionCabezas` (mismo criterio de días en UTC que la
 * pantalla de planificación) para no duplicar el manejo de fechas.
 */
@injectable()
export class ObtenerRepartoDiario {
  constructor(
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.ListPlanificacionCabezas)
    private readonly listPlanificacionCabezas: ListPlanificacionCabezas,
  ) {}

  async execute(input: ObtenerRepartoDiarioInput): Promise<RepartoDiario> {
    const empresa = await this.empresaRepository.getById(input.empresaId);
    if (!empresa) {
      throw new ApiError("Empresa no encontrada", Code.NOT_FOUND);
    }

    const claveDia = aClaveDeDia(input.fecha);
    const desde = new Date(input.fecha.getTime() - VENTANA_HABITUALES_DIAS * MS_POR_DIA);

    const [clientes, filas] = await Promise.all([
      this.clienteRepository.list(input.empresaId),
      this.listPlanificacionCabezas.execute({
        empresaId: input.empresaId,
        desde,
        hasta: input.fecha,
      }),
    ]);

    const clientePorId = new Map(clientes.map((cliente) => [cliente.id, cliente]));

    const lineas: LineaReparto[] = [];
    const llevanHoy = new Set<string>();
    const habituales = new Set<string>();

    for (const fila of filas) {
      const esHoy = aClaveDeDia(fila.fecha) === claveDia;
      if (esHoy) {
        if (fila.cabezasPlanificadas > 0) {
          const cliente = clientePorId.get(fila.clienteId);
          if (!cliente) continue;
          llevanHoy.add(fila.clienteId);
          lineas.push({
            clienteId: fila.clienteId,
            cliente: nombreCliente(cliente),
            cabezas: fila.cabezasPlanificadas,
            comentarios: fila.comentarios?.trim() ? fila.comentarios.trim() : null,
          });
        }
      } else if (fila.cabezasPlanificadas > 0 || fila.cabezasVendidas > 0) {
        habituales.add(fila.clienteId);
      }
    }

    const noLlevan: string[] = [];
    for (const clienteId of habituales) {
      if (llevanHoy.has(clienteId)) continue;
      const cliente = clientePorId.get(clienteId);
      if (cliente?.activo) noLlevan.push(nombreCliente(cliente));
    }

    lineas.sort((a, b) => a.cliente.localeCompare(b.cliente, "es"));
    noLlevan.sort((a, b) => a.localeCompare(b, "es"));

    return {
      empresa: { id: empresa.id, razonSocial: empresa.razonSocial },
      fecha: claveDia,
      lineas,
      totalCabezas: lineas.reduce((acc, linea) => acc + linea.cabezas, 0),
      noLlevan,
      generadoEn: new Date(),
    };
  }
}
