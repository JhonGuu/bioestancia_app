import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateLiquidacionFaenaFormValues } from "@/modules/liquidacion-faena/domain/liquidacion-faena.schemas";
import type { LiquidacionFaenaConCategorias } from "@/modules/liquidacion-faena/domain/liquidacion-faena.types";

export const liquidacionFaenaApi = {
  /** 404 (`ApiError.status === 404`) si la compra todavía no tiene una liquidación de faena cargada. */
  getByCompra(compraId: string): Promise<LiquidacionFaenaConCategorias> {
    return unwrap(httpClient.get(`/compras/${compraId}/liquidacion-faena`));
  },

  create(compraId: string, input: CreateLiquidacionFaenaFormValues): Promise<LiquidacionFaenaConCategorias> {
    const payload = {
      frigorificoId: input.frigorificoId || undefined,
      fecha: input.fecha,
      comentarios: input.comentarios || undefined,
      categorias: input.categorias.map((c) => ({
        compraCategoriaId: c.compraCategoriaId,
        canonPorAnimal: c.canonPorAnimal,
      })),
    };
    return unwrap(httpClient.post(`/compras/${compraId}/liquidacion-faena`, payload));
  },
};
