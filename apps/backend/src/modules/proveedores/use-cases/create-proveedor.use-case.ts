import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import {
  CreateProveedorInput,
  ProveedorRepository,
} from "@/modules/proveedores/domain/proveedor.repository";

@injectable()
export class CreateProveedor {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: CreateProveedorInput): Promise<Proveedor> {
    return this.proveedorRepository.create(input);
  }
}
