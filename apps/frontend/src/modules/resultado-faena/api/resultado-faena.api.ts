import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateResultadoFaenaFormValues } from "@/modules/resultado-faena/domain/resultado-faena.schemas";
import type { ResultadoFaenaConCategorias } from "@/modules/resultado-faena/domain/resultado-faena.types";

export const resultadoFaenaApi = {
  /** 404 (`ApiError.status === 404`) si la compra todavía no tiene un resultado de faena cargado. */
  getByCompra(compraId: string): Promise<ResultadoFaenaConCategorias> {
    return unwrap(httpClient.get(`/compras/${compraId}/resultado-faena`));
  },

  create(compraId: string, input: CreateResultadoFaenaFormValues): Promise<ResultadoFaenaConCategorias> {
    const payload = {
      frigorificoId: input.frigorificoId || undefined,
      fechaFaena: input.fechaFaena,
      numero: input.numero || undefined,
      numeroAutorizacion: input.numeroAutorizacion || undefined,
      comentarios: input.comentarios || undefined,
      categorias: input.categorias.map((c) => ({
        compraCategoriaId: c.compraCategoriaId,
        kgVivoFaena: c.kgVivoFaena,
        kgCarne: c.kgCarne,
        porcentajeMagro: c.porcentajeMagro || undefined,
        destinoComercial: c.destinoComercial || undefined,
        cuartosDelantero: c.cuartosDelantero || undefined,
        cuartosTrasero: c.cuartosTrasero || undefined,
        comisosCabezas: c.comisosCabezas || undefined,
        comisosKg: c.comisosKg || undefined,
      })),
    };
    return unwrap(httpClient.post(`/compras/${compraId}/resultado-faena`, payload));
  },
};
