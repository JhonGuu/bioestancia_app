/**
 * Espejo de `apps/backend/src/modules/ventas/domain/*`.
 */

import type { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";

/**
 * Presentación del ítem — separado de `categoria` (ver `Venta` más abajo).
 * Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 */
export const FormaVenta = {
  CABEZA: "cabeza",
  MEDIA_RES: "media_res",
  PULPA: "pulpa",
  COMPENSACION_KG: "compensacion_kg",
} as const;
export type FormaVenta = (typeof FormaVenta)[keyof typeof FormaVenta];

export const FORMA_VENTA_LABELS: Record<FormaVenta, string> = {
  [FormaVenta.CABEZA]: "Cabeza (animal entero)",
  [FormaVenta.MEDIA_RES]: "Media res",
  [FormaVenta.PULPA]: "Pulpa (corte)",
  [FormaVenta.COMPENSACION_KG]: "Compensación de kg",
};

/**
 * `precioKg`/`total` nullable: el operario carga la venta sin precio (ver
 * módulo `boletas`) — admin/contable lo completa después.
 */
export interface Venta {
  id: string;
  empresaId: string;
  clienteId: string;
  boletaId: string | null;
  compraId: string | null;
  garron: number | null;
  formaVenta: FormaVenta;
  categoria: CategoriaVenta | null;
  kg: number;
  precioKg: number | null;
  total: number | null;
  fecha: string;
  clienteFinalId: string | null;
  comentarios: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
