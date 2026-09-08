import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Asiento } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";

@injectable()
export class ObtenerAsiento {
  constructor(@inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository) {}

  async execute(id: string, empresaId: string): Promise<Asiento> {
    const asiento = await this.asientoRepository.getById(id, empresaId);
    if (!asiento) throw new ApiError("El asiento no existe", Code.NOT_FOUND);
    return asiento;
  }
}
