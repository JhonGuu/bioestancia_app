import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Ejercicio, Periodo } from "@/modules/contabilidad/domain/ejercicio";
import { EjercicioRepository } from "@/modules/contabilidad/domain/ejercicio.repository";

export interface EjercicioConPeriodos extends Ejercicio {
  periodos: Periodo[];
}

@injectable()
export class ListarEjercicios {
  constructor(
    @inject(DI_TYPES.EjercicioRepository) private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async execute(empresaId: string): Promise<EjercicioConPeriodos[]> {
    const ejercicios = await this.ejercicioRepository.list(empresaId);
    return Promise.all(
      ejercicios.map(async (ejercicio) => ({
        ...ejercicio,
        periodos: await this.ejercicioRepository.listPeriodos(ejercicio.id),
      })),
    );
  }
}
