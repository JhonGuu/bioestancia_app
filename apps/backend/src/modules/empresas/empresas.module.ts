import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { EmpresaController } from "@/modules/empresas/infra/http/empresa.controller";
import { EmpresaValidation } from "@/modules/empresas/infra/http/validation";
import { EmpresaRepositoryDrizzle } from "@/modules/empresas/infra/repository/empresa.repository";
import { CreateEmpresa } from "@/modules/empresas/use-cases/create-empresa.use-case";
import { ListEmpresas } from "@/modules/empresas/use-cases/list-empresas.use-case";
import { UpdateEmpresa } from "@/modules/empresas/use-cases/update-empresa.use-case";

export function registerEmpresasModule(container: Container): void {
  // Validations
  container.bind(DI_TYPES.EmpresaValidation).to(EmpresaValidation);

  // Repositories
  container.bind(DI_TYPES.EmpresaRepository).to(EmpresaRepositoryDrizzle);

  // Use-cases
  container.bind(DI_TYPES.CreateEmpresa).to(CreateEmpresa);
  container.bind(DI_TYPES.ListEmpresas).to(ListEmpresas);
  container.bind(DI_TYPES.UpdateEmpresa).to(UpdateEmpresa);

  // Controller (eager)
  container.bind(DI_TYPES.EmpresaController).to(EmpresaController);
  container.get(DI_TYPES.EmpresaController);
}
