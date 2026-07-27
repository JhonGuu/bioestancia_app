import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";

export interface ListProveedoresInput {
  empresaId: string;
}

@injectable()
export class ListProveedores {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
  ) {}

  async execute(input: ListProveedoresInput): Promise<Proveedor[]> {
    return this.proveedorRepository.list(input.empresaId);
  }
}
