import type { CompraCategoria } from "@/modules/compras/domain/compra.types";

/**
 * Espejo de `apps/backend/src/modules/liquidacion-compra/domain/liquidacion-compra.ts`.
 * El comprobante fiscal (AFIP/ARCA) que se le emite al proveedor por la
 * tropa — distinto de `liquidacion-faena` (lo que cobra el frigorífico).
 */
export interface LiquidacionCompra {
  id: string;
  compraId: string;
  numeroComprobante: string;
  fecha: string;
  fechaOperacion: string | null;
  cae: string | null;
  fechaVencimientoCae: string | null;
  importeBruto: number;
  ivaSobreBruto: number;
  totalGastos: number | null;
  ivaSobreGastos: number | null;
  totalTributos: number | null;
  importeNeto: number;
  comentarios: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lo que devuelve `GET /compras/:compraId/liquidacion` — el header + las líneas de categoría ya facturadas. */
export interface LiquidacionCompraConCategorias extends LiquidacionCompra {
  categorias: CompraCategoria[];
}
