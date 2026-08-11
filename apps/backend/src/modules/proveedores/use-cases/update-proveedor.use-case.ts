import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import {
  ProveedorRepository,
  UpdateProveedorInput,
} from "@/modules/proveedores/domain/proveedor.repository";

export type UpdateProveedorUseCaseInput = UpdateProveedorInput & {
  id: string;
  empresaId: string;
};

/** El 404 (si no existe o no es de esta empresa) lo tira el repositorio, ver `update()`. */
@injectable()
export class UpdateProveedor {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: UpdateProveedorUseCaseInput): Promise<Proveedor> {
    const { id, empresaId, ...rest } = input;
    return this.proveedorRepository.update(id, empresaId, rest);
  }
}
