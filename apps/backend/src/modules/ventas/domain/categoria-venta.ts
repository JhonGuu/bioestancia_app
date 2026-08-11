import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";

/**
 * Categorías de venta que NO salen del catálogo porcino AFIP (`CategoriaPorcino`).
 * Hoy solo `NOVILLO`: reventa de media res de bovino a un cliente puntual —
 * no sale de ninguna tropa/compra nuestra (no hay `compraId`), no pasa por
 * liquidación, y no afecta la reconciliación de cabezas de ninguna compra
 * (`CerrarCompra` filtra por `compraId`, así que estas ventas quedan afuera
 * automáticamente). Se modela acá, separado de `compras/categoria-porcino`,
 * porque es un concepto exclusivo de venta sin equivalente en AFIP/WSLSP —
 * si el día de mañana se revende otra cosa (ej. cordero), el nuevo valor va acá.
 */
export enum CategoriaReventa {
  NOVILLO = "Novillo",
}

export type CategoriaVenta = CategoriaPorcino | CategoriaReventa;

export function esReventa(categoria: CategoriaVenta | null | undefined): boolean {
  return categoria === CategoriaReventa.NOVILLO;
}
