import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Ejercicio, EstadoEjercicio, EstadoPeriodo } from "@/modules/contabilidad/domain/ejercicio";
import { EjercicioRepository } from "@/modules/contabilidad/domain/ejercicio.repository";

/**
 * Cerrar o reabrir un ejercicio.
 *
 * Al cerrarlo se cierran también todos sus períodos (si no, quedaría un mes
 * abierto adentro de un ejercicio cerrado y se podrían seguir cargando
 * asientos). Al reabrirlo NO se reabren solos: se reabre el ejercicio y
 * después el mes puntual que haga falta, así reabrir es siempre explícito.
 *
 * El asiento de cierre en sí (refundición, cierre, apertura del siguiente)
 * se puede cargar a mano como cualquier asiento eligiendo el tipo, o
 * generarlo automáticamente cuando llegue la fase 5.
 */
@injectable()
export class CambiarEstadoEjercicio {
  constructor(
    @inject(DI_TYPES.EjercicioRepository) private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async execute(id: string, empresaId: string, estado: EstadoEjercicio): Promise<Ejercicio> {
    const ejercicio = await this.ejercicioRepository.getById(id, empresaId);
    if (!ejercicio) throw new ApiError("El ejercicio no existe", Code.NOT_FOUND);

    if (estado === EstadoEjercicio.CERRADO) {
      const periodos = await this.ejercicioRepository.listPeriodos(id);
      for (const periodo of periodos.filter((p) => p.estado === EstadoPeriodo.ABIERTO)) {
        await this.ejercicioRepository.cambiarEstadoPeriodo(periodo.id, EstadoPeriodo.CERRADO);
      }
    }

    return this.ejercicioRepository.cambiarEstado(id, empresaId, estado);
  }
}
