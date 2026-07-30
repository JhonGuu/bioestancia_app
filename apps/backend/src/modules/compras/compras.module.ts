import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CompraController } from "@/modules/compras/infra/http/compra.controller";
import { CompraValidation } from "@/modules/compras/infra/http/validation";
import { CompraRepositoryDrizzle } from "@/modules/compras/infra/repository/compra.repository";
import { CompraCategoriaRepositoryDrizzle } from "@/modules/compras/infra/repository/compra-categoria.repository";
import { CreateCompra } from "@/modules/compras/use-cases/create-compra.use-case";
import { ListCompras } from "@/modules/compras/use-cases/list-compras.use-case";
import { GetCompra } from "@/modules/compras/use-cases/get-compra.use-case";
import { UpdateCompra } from "@/modules/compras/use-cases/update-compra.use-case";
import { CerrarCompra } from "@/modules/compras/use-cases/cerrar-compra.use-case";
import { ReabrirCompra } from "@/modules/compras/use-cases/reabrir-compra.use-case";

export function registerComprasModule(container: Container): void {
  container.bind(DI_TYPES.CompraValidation).to(CompraValidation);
  container.bind(DI_TYPES.CompraRepository).to(CompraRepositoryDrizzle);
  container.bind(DI_TYPES.CompraCategoriaRepository).to(CompraCategoriaRepositoryDrizzle);
  container.bind(DI_TYPES.CreateCompra).to(CreateCompra);
  container.bind(DI_TYPES.ListCompras).to(ListCompras);
  container.bind(DI_TYPES.GetCompra).to(GetCompra);
  container.bind(DI_TYPES.UpdateCompra).to(UpdateCompra);
  container.bind(DI_TYPES.CerrarCompra).to(CerrarCompra);
  container.bind(DI_TYPES.ReabrirCompra).to(ReabrirCompra);
  container.bind(DI_TYPES.CompraController).to(CompraController);
  container.get(DI_TYPES.CompraController);
}
