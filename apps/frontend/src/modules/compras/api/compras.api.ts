import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  CreateCompraFormValues,
  UpdateCompraFormValues,
} from "@/modules/compras/domain/compra.schemas";
import type { Compra, CompraConCategorias } from "@/modules/compras/domain/compra.types";

export const comprasApi = {
  list(): Promise<Compra[]> {
    return unwrap(httpClient.get("/compras"));
  },

  getById(id: string): Promise<CompraConCategorias> {
    return unwrap(httpClient.get(`/compras/${id}`));
  },

  create(input: CreateCompraFormValues): Promise<CompraConCategorias> {
    const { letra, porcentajeDesbaste, comentarios, categorias, ...rest } = input;
    const payload = {
      ...rest,
      letra: letra || undefined,
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
    const { letra, porcentajeDesbaste, comentarios, categorias, ...rest } = input;
    const payload = {
      ...rest,
      letra: letra || undefined,
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
};
