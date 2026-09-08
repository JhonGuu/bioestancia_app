import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Ejercicio, generarPeriodos } from "@/modules/contabilidad/domain/ejercicio";
import { EjercicioRepository } from "@/modules/contabilidad/domain/ejercicio.repository";

export interface CrearEjercicioInput {
  empresaId: string;
  nombre?: string;
  fechaInicio: Date;
  fechaFin: Date;
}

/**
 * Crea un ejercicio y sus períodos mensuales de una. Es por empresa: El
 * Meridiano cierra en diciembre y Bioestancia en mayo, así que cada una
 * define sus propias fechas — el sistema no impone ningún mes de cierre.
 */
@injectable()
export class CrearEjercicio {
  constructor(
    @inject(DI_TYPES.EjercicioRepository) private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async execute(input: CrearEjercicioInput): Promise<Ejercicio> {
    if (input.fechaFin <= input.fechaInicio) {
      throw new ApiError("La fecha de cierre tiene que ser posterior a la de inicio", Code.BAD_REQUEST);
    }

    const solapado = await this.ejercicioRepository.existeSolapado(
      input.empresaId,
      input.fechaInicio,
      input.fechaFin,
    );
    if (solapado) {
      throw new ApiError(
        "Ya hay un ejercicio de esta empresa que se superpone con esas fechas",
        Code.BAD_REQUEST,
      );
    }

    const anteriores = await this.ejercicioRepository.list(input.empresaId);
    const numero = anteriores.reduce((maximo, e) => Math.max(maximo, e.numero), 0) + 1;

    const ejercicio = await this.ejercicioRepository.create({
      empresaId: input.empresaId,
      numero,
      nombre: input.nombre?.trim() || `Ejercicio ${numero}`,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
    });

    await this.ejercicioRepository.createPeriodos(
      ejercicio.id,
      generarPeriodos(input.fechaInicio, input.fechaFin),
    );

    return ejercicio;
  }
}
