import { httpClient, unwrap } from "@/shared/api/http-client";
import type { PaginatedResult } from "@/shared/api/pagination.types";
import type { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
import type { Venta } from "@/modules/ventas/domain/venta.types";

export interface UpdateVentaItemInput {
  garron?: number | null;
  kg?: number;
  categoria?: CategoriaVenta | null;
  comentarios?: string | null;
}

export const ventasApi = {
  /** Trae TODAS las ventas de la empresa activa, sin paginar — mismo comportamiento de siempre. Para una pantalla nueva de listado, usar `listPaginado`. */
  list(): Promise<Venta[]> {
    return unwrap(httpClient.get("/ventas"));
  },

  /** Trae una página de ventas. `page` arranca en 1. */
  listPaginado(page: number, limit: number): Promise<PaginatedResult<Venta>> {
    return unwrap(httpClient.get("/ventas", { params: { page, limit } }));
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

  /** Corrige garrón/kg/categoría/comentarios de una línea ya cargada — para arreglar una carga mal hecha. */
  updateItem(id: string, input: UpdateVentaItemInput): Promise<Venta> {
    return unwrap(httpClient.patch(`/ventas/${id}`, input));
  },

  /** Borra (soft-delete) una línea de venta. */
  delete(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/ventas/${id}`));
  },
};
