import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ProveedorController } from "@/modules/proveedores/infra/http/proveedor.controller";
import { ProveedorValidation } from "@/modules/proveedores/infra/http/validation";
import { ProveedorRepositoryDrizzle } from "@/modules/proveedores/infra/repository/proveedor.repository";
import { CreateProveedor } from "@/modules/proveedores/use-cases/create-proveedor.use-case";
import { ListProveedores } from "@/modules/proveedores/use-cases/list-proveedores.use-case";
import { GetProveedor } from "@/modules/proveedores/use-cases/get-proveedor.use-case";
import { UpdateProveedor } from "@/modules/proveedores/use-cases/update-proveedor.use-case";
import { DeleteProveedor } from "@/modules/proveedores/use-cases/delete-proveedor.use-case";
import { ReactivarProveedor } from "@/modules/proveedores/use-cases/reactivar-proveedor.use-case";

export function registerProveedoresModule(container: Container): void {
  container.bind(DI_TYPES.ProveedorValidation).to(ProveedorValidation);
  container.bind(DI_TYPES.ProveedorRepository).to(ProveedorRepositoryDrizzle);
  container.bind(DI_TYPES.CreateProveedor).to(CreateProveedor);
  container.bind(DI_TYPES.ListProveedores).to(ListProveedores);
  container.bind(DI_TYPES.GetProveedor).to(GetProveedor);
  container.bind(DI_TYPES.UpdateProveedor).to(UpdateProveedor);
  container.bind(DI_TYPES.DeleteProveedor).to(DeleteProveedor);
  container.bind(DI_TYPES.ReactivarProveedor).to(ReactivarProveedor);
  container.bind(DI_TYPES.ProveedorController).to(ProveedorController);
  container.get(DI_TYPES.ProveedorController);
}
