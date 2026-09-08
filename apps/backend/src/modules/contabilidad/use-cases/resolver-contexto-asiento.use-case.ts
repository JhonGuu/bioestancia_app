import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Ejercicio, EstadoEjercicio, EstadoPeriodo, Periodo } from "@/modules/contabilidad/domain/ejercicio";
import { EjercicioRepository } from "@/modules/contabilidad/domain/ejercicio.repository";

export interface ContextoAsiento {
  ejercicio: Ejercicio;
  periodo: Periodo;
}

/**
 * Ubica un asiento en el tiempo: qué ejercicio y qué período mensual le
 * corresponden a una fecha, y si están abiertos.
 *
 * Vive en un solo lugar a propósito — la regla "no se imputa en un período
 * cerrado" la comparten la carga manual, la apertura y (más adelante) el
 * motor de asientos automáticos; duplicada en tres lados terminaría
 * divergiendo.
 */
@injectable()
export class ResolverContextoAsiento {
  constructor(
    @inject(DI_TYPES.EjercicioRepository) private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async execute(empresaId: string, fecha: Date, exigirAbierto = true): Promise<ContextoAsiento> {
    const ejercicio = await this.ejercicioRepository.getByFecha(empresaId, fecha);
    if (!ejercicio) {
      throw new ApiError(
        "No hay ningún ejercicio contable que cubra esa fecha — creá el ejercicio primero",
        Code.BAD_REQUEST,
      );
    }
    if (exigirAbierto && ejercicio.estado === EstadoEjercicio.CERRADO) {
      throw new ApiError(`El ejercicio "${ejercicio.nombre}" está cerrado`, Code.BAD_REQUEST);
    }

    const periodo = await this.ejercicioRepository.getPeriodoPorFecha(ejercicio.id, fecha);
    if (!periodo) {
      throw new ApiError("No existe el período mensual para esa fecha", Code.BAD_REQUEST);
    }
    if (exigirAbierto && periodo.estado === EstadoPeriodo.CERRADO) {
      throw new ApiError(
        `El período ${String(periodo.mes).padStart(2, "0")}/${periodo.anio} está cerrado — reabrilo si necesitás modificarlo`,
        Code.BAD_REQUEST,
      );
    }

    return { ejercicio, periodo };
  }
}
