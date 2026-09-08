import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EstadoEjercicio, EstadoPeriodo, Periodo } from "@/modules/contabilidad/domain/ejercicio";
import { EjercicioRepository } from "@/modules/contabilidad/domain/ejercicio.repository";

/**
 * Cerrar un período congela sus asientos: es la única barrera dura del
 * sistema. Reabrirlo también está permitido (el sistema es de gestión, no
 * de libros rubricados) — pero si el ejercicio entero está cerrado hay que
 * reabrirlo primero, para que reabrir un mes sea siempre una decisión
 * consciente y no un efecto colateral.
 */
@injectable()
export class CambiarEstadoPeriodo {
  constructor(
    @inject(DI_TYPES.EjercicioRepository) private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async execute(periodoId: string, empresaId: string, estado: EstadoPeriodo): Promise<Periodo> {
    const periodo = await this.ejercicioRepository.getPeriodoById(periodoId);
    if (!periodo) throw new ApiError("El período no existe", Code.NOT_FOUND);

    const ejercicio = await this.ejercicioRepository.getById(periodo.ejercicioId, empresaId);
    if (!ejercicio) throw new ApiError("El período no pertenece a esta empresa", Code.NOT_FOUND);

    if (estado === EstadoPeriodo.ABIERTO && ejercicio.estado === EstadoEjercicio.CERRADO) {
      throw new ApiError(
        "El ejercicio está cerrado — reabrilo primero si necesitás tocar este período",
        Code.BAD_REQUEST,
      );
    }

    return this.ejercicioRepository.cambiarEstadoPeriodo(periodoId, estado);
  }
}
