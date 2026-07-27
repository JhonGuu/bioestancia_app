import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ClienteController } from "@/modules/clientes/infra/http/cliente.controller";
import { ClienteValidation } from "@/modules/clientes/infra/http/validation";
import { ClienteRepositoryDrizzle } from "@/modules/clientes/infra/repository/cliente.repository";
import { CreateCliente } from "@/modules/clientes/use-cases/create-cliente.use-case";
import { ListClientes } from "@/modules/clientes/use-cases/list-clientes.use-case";
import { GetCliente } from "@/modules/clientes/use-cases/get-cliente.use-case";

export function registerClientesModule(container: Container): void {
  container.bind(DI_TYPES.ClienteValidation).to(ClienteValidation);
  container.bind(DI_TYPES.ClienteRepository).to(ClienteRepositoryDrizzle);
  container.bind(DI_TYPES.CreateCliente).to(CreateCliente);
  container.bind(DI_TYPES.ListClientes).to(ListClientes);
  container.bind(DI_TYPES.GetCliente).to(GetCliente);
  container.bind(DI_TYPES.ClienteController).to(ClienteController);
  container.get(DI_TYPES.ClienteController);
}
