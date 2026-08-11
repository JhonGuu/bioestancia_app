import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";

export interface ReactivarProveedorInput {
  id: string;
  empresaId: string;
}

/** Deshace un soft-delete — ver comentario en `ProveedorRepository.reactivar()`. El 404 lo tira el repositorio. */
@injectable()
export class ReactivarProveedor {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: ReactivarProveedorInput): Promise<Proveedor> {
    return this.proveedorRepository.reactivar(input.id, input.empresaId);
  }
}
