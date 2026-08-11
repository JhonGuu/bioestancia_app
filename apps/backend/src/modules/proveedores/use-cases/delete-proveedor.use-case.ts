import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";

export interface DeleteProveedorInput {
  id: string;
  empresaId: string;
}

/** Soft-delete — ver comentario en `ProveedorRepository.delete()`. El 404 lo tira el repositorio. */
@injectable()
export class DeleteProveedor {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: DeleteProveedorInput): Promise<void> {
    await this.proveedorRepository.delete(input.id, input.empresaId);
  }
}
