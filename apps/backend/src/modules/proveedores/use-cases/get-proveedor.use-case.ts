import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";

export interface GetProveedorInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetProveedor {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: GetProveedorInput): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.getById(input.id, input.empresaId);
    if (!proveedor) {
      throw new ApiError("Proveedor no encontrado", Code.NOT_FOUND);
    }
    return proveedor;
  }
}
