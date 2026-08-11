import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Empresa, Rubro } from "@/modules/empresas/domain/empresa";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";

export interface CreateEmpresaInput {
  razonSocial: string;
  cuit?: string;
  telefono?: string;
  direccion?: string;
  rubro: Rubro;
}

@injectable()
export class CreateEmpresa {
  constructor(
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
  ) {}

  async execute(input: CreateEmpresaInput): Promise<Empresa> {
    return this.empresaRepository.create(input);
  }
}
