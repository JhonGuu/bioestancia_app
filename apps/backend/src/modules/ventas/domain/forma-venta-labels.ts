import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

/**
 * Etiquetas para mostrar en documentos (PDF/Excel) — separado de
 * `forma-venta.ts` porque es texto de presentación, no dominio. "1/2 res" en
 * vez de "Media res" a propósito: es el texto que usa la boleta de papel
 * original de El Meridiano.
 */
export const FORMA_VENTA_LABELS: Record<FormaVenta, string> = {
  [FormaVenta.CABEZA]: "Cabeza",
  [FormaVenta.MEDIA_RES]: "1/2 res",
  [FormaVenta.PULPA]: "Pulpa",
  [FormaVenta.COMPENSACION_KG]: "Compensación",
};

/** "Porcina Capón" → "Capón" — más corto y legible en un documento. */
export function categoriaCorta(categoria: string): string {
  return categoria.replace(/^Porcina\s+/, "");
}

/** Texto de la columna "Detalle" de la boleta: presentación + categoría (ej. "1/2 res Capón"). */
export function detalleVenta(formaVenta: FormaVenta, categoria: string | null): string {
  const forma = FORMA_VENTA_LABELS[formaVenta];
  if (!categoria) return forma;
  return `${forma} ${categoriaCorta(categoria)}`;
}
