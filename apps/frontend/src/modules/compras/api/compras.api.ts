import { httpClient, unwrap } from "@/shared/api/http-client";
import type { PaginatedResult } from "@/shared/api/pagination.types";
import type {
  CreateCompraFormValues,
  UpdateCompraFormValues,
} from "@/modules/compras/domain/compra.schemas";
import type { Compra, CompraConCategorias, StockTropa } from "@/modules/compras/domain/compra.types";

export const comprasApi = {
  /** Trae TODAS las compras de la empresa activa, sin paginar — mismo comportamiento de siempre. Para una pantalla nueva de listado, usar `listPaginado`. */
  list(): Promise<Compra[]> {
    return unwrap(httpClient.get("/compras"));
  },

  /** Trae una página de compras. `page` arranca en 1. */
  listPaginado(page: number, limit: number): Promise<PaginatedResult<Compra>> {
    return unwrap(httpClient.get("/compras", { params: { page, limit } }));
  },

  getById(id: string): Promise<CompraConCategorias> {
    return unwrap(httpClient.get(`/compras/${id}`));
  },

  create(input: CreateCompraFormValues): Promise<CompraConCategorias> {
    const { letra, precioCompraKg, porcentajeDesbaste, comentarios, categorias, ...rest } = input;
    const payload = {
      ...rest,
      letra: letra || undefined,
      precioCompraKg: precioCompraKg || undefined,
      porcentajeDesbaste: porcentajeDesbaste || undefined,
      comentarios: comentarios || undefined,
      categorias: categorias.map((c) => ({
        categoria: c.categoria,
        raza: c.raza || undefined,
        cabezas: c.cabezas,
      })),
    };
    return unwrap(httpClient.post("/compras", payload));
  },

  /** Edita la compra completa (proveedor, especie, datos generales y categorías). Rechazado si ya está cerrada. */
  update(id: string, input: UpdateCompraFormValues): Promise<CompraConCategorias> {
    const { letra, precioCompraKg, porcentajeDesbaste, comentarios, categorias, ...rest } = input;
    const payload = {
      ...rest,
      letra: letra || undefined,
      precioCompraKg: precioCompraKg || undefined,
      porcentajeDesbaste: porcentajeDesbaste || undefined,
      comentarios: comentarios || undefined,
      categorias: categorias.map((c) => ({
        id: c.id || undefined,
        categoria: c.categoria,
        raza: c.raza || undefined,
        cabezas: c.cabezas,
      })),
    };
    return unwrap(httpClient.patch(`/compras/${id}`, payload));
  },

  /** Reconcilia cabezas vendidas contra compradas y, si coinciden, calcula el rinde. */
  cerrar(id: string): Promise<Compra> {
    return unwrap(httpClient.post(`/compras/${id}/cerrar`));
  },

  /** Deshace el cierre — para corregir algo y volver a cerrar después. */
  reabrir(id: string): Promise<Compra> {
    return unwrap(httpClient.post(`/compras/${id}/reabrir`));
  },

  /** Stock teórico (compradas − vendidas) de cada tropa ABIERTA de la empresa activa. */
  stockTropas(): Promise<StockTropa[]> {
    return unwrap(httpClient.get("/compras/stock"));
  },
};
