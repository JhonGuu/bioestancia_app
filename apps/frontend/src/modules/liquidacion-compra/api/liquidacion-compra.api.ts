import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateLiquidacionCompraFormValues } from "@/modules/liquidacion-compra/domain/liquidacion-compra.schemas";
import type {
  LiquidacionCompra,
  LiquidacionCompraConCategorias,
} from "@/modules/liquidacion-compra/domain/liquidacion-compra.types";

// La URL real del backend es `/compras/:compraId/liquidacion` (sin "-compra")
// — ver `LiquidacionCompraController` — aunque el módulo/carpeta acá se
// llame `liquidacion-compra` para distinguirlo de `liquidacion-faena`.
export const liquidacionCompraApi = {
  /** 404 (`ApiError.status === 404`) si la compra todavía no tiene una liquidación cargada. */
  getByCompra(compraId: string): Promise<LiquidacionCompraConCategorias> {
    return unwrap(httpClient.get(`/compras/${compraId}/liquidacion`));
  },

  create(
    compraId: string,
    input: CreateLiquidacionCompraFormValues,
  ): Promise<LiquidacionCompraConCategorias> {
    const payload = {
      numeroComprobante: input.numeroComprobante,
      fecha: input.fecha,
      fechaOperacion: input.fechaOperacion || undefined,
      cae: input.cae || undefined,
      fechaVencimientoCae: input.fechaVencimientoCae || undefined,
      totalGastos: input.totalGastos || undefined,
      ivaSobreGastos: input.ivaSobreGastos || undefined,
      totalTributos: input.totalTributos || undefined,
      comentarios: input.comentarios || undefined,
      categorias: input.categorias.map((c) => ({
        compraCategoriaId: c.compraCategoriaId,
        precioKg: c.precioKg,
        porcentajeIva: c.porcentajeIva,
      })),
    };
    return unwrap(httpClient.post(`/compras/${compraId}/liquidacion`, payload));
  },

  /** Le pide el CAE a AFIP (WSLSP) — falla con 501 si el ambiente todavía no tiene el certificado configurado. */
  emitirCae(compraId: string): Promise<LiquidacionCompra> {
    return unwrap(httpClient.post(`/compras/${compraId}/liquidacion/emitir-cae`));
  },
};
