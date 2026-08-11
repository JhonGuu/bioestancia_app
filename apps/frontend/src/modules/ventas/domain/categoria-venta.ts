/**
 * Espejo de `apps/backend/src/modules/ventas/domain/categoria-venta.ts`.
 * Categorías de venta que no salen del catálogo porcino (`CategoriaPorcino`)
 * — hoy solo reventa de media res de Novillo (bovino), sin tropa propia.
 */
import { CategoriaPorcino } from "@/modules/compras/domain/compra.types";

export const CategoriaReventa = {
  NOVILLO: "Novillo",
} as const;
export type CategoriaReventa = (typeof CategoriaReventa)[keyof typeof CategoriaReventa];

export type CategoriaVenta = CategoriaPorcino | CategoriaReventa;

export function esReventa(categoria: CategoriaVenta | null | undefined): boolean {
  return categoria === CategoriaReventa.NOVILLO;
}
