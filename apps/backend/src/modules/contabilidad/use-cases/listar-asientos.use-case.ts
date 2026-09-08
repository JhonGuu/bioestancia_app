import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Asiento } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository, ListarAsientosFiltros } from "@/modules/contabilidad/domain/asiento.repository";

/** Base del libro diario: asientos ordenados por fecha con sus líneas. */
@injectable()
export class ListarAsientos {
  constructor(@inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository) {}

  async execute(filtros: ListarAsientosFiltros): Promise<Asiento[]> {
    return this.asientoRepository.list(filtros);
  }
}
