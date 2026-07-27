import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { PlanificacionCabezas } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas";
import { PlanificacionCabezasRepository } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";

export interface UpsertPlanificacionCabezasDiaInput {
  fecha: Date;
  cabezasPlanificadas: number;
  comentarios?: string;
}

export interface UpsertPlanificacionCabezasUseCaseInput {
  empresaId: string;
  clienteId: string;
  /** Uno o varios días — normalmente los días de la semana que se está planificando. */
  dias: UpsertPlanificacionCabezasDiaInput[];
}

/**
 * Carga o revisa el plan de cabezas de un cliente para uno o varios días.
 *
 * Es un upsert por `(clienteId, fecha)`: si ya había un plan para ese
 * cliente en ese día, lo actualiza (el plan de la semana se revisa seguido,
 * no tiene sentido bloquear la recarga). `fecha` se normaliza a medianoche
 * para que el `unique(clienteId, fecha)` de la tabla funcione sin importar
 * qué hora venga en el body.
 */
@injectable()
export class UpsertPlanificacionCabezas {
  constructor(
    @inject(DI_TYPES.PlanificacionCabezasRepository)
    private readonly planificacionCabezasRepository: PlanificacionCabezasRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: UpsertPlanificacionCabezasUseCaseInput): Promise<PlanificacionCabezas[]> {
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("Cliente no encontrado", Code.NOT_FOUND);
    }

    return this.planificacionCabezasRepository.upsertMany(
      input.dias.map((dia) => ({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        fecha: this.aMedianoche(dia.fecha),
        cabezasPlanificadas: dia.cabezasPlanificadas,
        comentarios: dia.comentarios,
      })),
    );
  }

  private aMedianoche(fecha: Date): Date {
    const normalizada = new Date(fecha);
    normalizada.setHours(0, 0, 0, 0);
    return normalizada;
  }
}
