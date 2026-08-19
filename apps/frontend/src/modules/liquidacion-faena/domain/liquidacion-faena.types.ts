import type { CompraCategoria } from "@/modules/compras/domain/compra.types";

/**
 * Espejo de `apps/backend/src/modules/liquidacion-faena/domain/liquidacion-faena.ts`.
 * Lo que el FRIGORÍFICO cobra por faenar una tropa — distinto de
 * `liquidacion-compra` (lo que ELLOS le facturan al proveedor).
 */
export interface LiquidacionFaena {
  id: string;
  compraId: string;
  frigorificoId: string | null;
  fecha: string;
  comentarios: string | null;
  total: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lo que devuelve `GET /compras/:compraId/liquidacion-faena` — el header + las líneas de categoría con el canon ya completado. */
export interface LiquidacionFaenaConCategorias extends LiquidacionFaena {
  categorias: CompraCategoria[];
}
