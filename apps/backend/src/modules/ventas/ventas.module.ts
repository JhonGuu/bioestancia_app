import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { VentaController } from "@/modules/ventas/infra/http/venta.controller";
import { VentaValidation } from "@/modules/ventas/infra/http/validation";
import { VentaRepositoryDrizzle } from "@/modules/ventas/infra/repository/venta.repository";
import { CreateVenta } from "@/modules/ventas/use-cases/create-venta.use-case";
import { ListVentas } from "@/modules/ventas/use-cases/list-ventas.use-case";
import { GetVenta } from "@/modules/ventas/use-cases/get-venta.use-case";
import { SetPrecioVenta } from "@/modules/ventas/use-cases/set-precio-venta.use-case";
import { SetPrecioVentasLote } from "@/modules/ventas/use-cases/set-precio-ventas-lote.use-case";
import { UpdateVentaItem } from "@/modules/ventas/use-cases/update-venta-item.use-case";
import { DeleteVenta } from "@/modules/ventas/use-cases/delete-venta.use-case";

/**
 * `SetPrecioVenta`/`UpdateVentaItem`/`DeleteVenta` dependen de `CobroRepository`
 * (re-ajustan aplicaciones FIFO si la venta pertenece a una boleta con cobros
 * ya aplicados) — el binding se hace temprano en `di.ts`, no acá (ver comentario ahí).
 */
export function registerVentasModule(container: Container): void {
  container.bind(DI_TYPES.VentaValidation).to(VentaValidation);
  container.bind(DI_TYPES.VentaRepository).to(VentaRepositoryDrizzle);
  container.bind(DI_TYPES.CreateVenta).to(CreateVenta);
  container.bind(DI_TYPES.ListVentas).to(ListVentas);
  container.bind(DI_TYPES.GetVenta).to(GetVenta);
  container.bind(DI_TYPES.SetPrecioVenta).to(SetPrecioVenta);
  container.bind(DI_TYPES.SetPrecioVentasLote).to(SetPrecioVentasLote);
  container.bind(DI_TYPES.UpdateVentaItem).to(UpdateVentaItem);
  container.bind(DI_TYPES.DeleteVenta).to(DeleteVenta);
  container.bind(DI_TYPES.VentaController).to(VentaController);
  container.get(DI_TYPES.VentaController);
}
