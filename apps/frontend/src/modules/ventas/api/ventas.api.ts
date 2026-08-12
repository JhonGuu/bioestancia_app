import { httpClient, unwrap } from "@/shared/api/http-client";
import type { Venta } from "@/modules/ventas/domain/venta.types";

export const ventasApi = {
  list(): Promise<Venta[]> {
    return unwrap(httpClient.get("/ventas"));
  },

  getById(id: string): Promise<Venta> {
    return unwrap(httpClient.get(`/ventas/${id}`));
  },

  /** Completa/corrige el precio de una venta cargada sin él (flujo del operario vía boletas). */
  setPrecio(id: string, precioKg: number): Promise<Venta> {
    return unwrap(httpClient.patch(`/ventas/${id}/precio`, { precioKg }));
  },

  /** Aplica el mismo precio a varias ventas de una vez (ej. todas las de una categoría dentro de una boleta). */
  setPrecioLote(ventaIds: string[], precioKg: number): Promise<Venta[]> {
    return unwrap(httpClient.patch("/ventas/precio-lote", { ventaIds, precioKg }));
  },
};
