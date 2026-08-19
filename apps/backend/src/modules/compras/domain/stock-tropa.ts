import { Compra } from "@/modules/compras/domain/compra";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";

/** Cabezas compradas de una categoría puntual dentro de una tropa — ver `StockTropa.categorias`. */
export interface StockTropaCategoria {
  categoria: CategoriaPorcino;
  cabezas: number;
}

/**
 * Stock TEÓRICO de una tropa abierta — ver
 * `use-cases/obtener-stock-tropas.use-case.ts` para el cálculo. Vive acá (no
 * en el use-case) para que otros módulos (ej. `boletas`, en el reporte
 * diario) puedan referenciar el tipo sin importar desde la capa de use-cases.
 */
export interface StockTropa extends Compra {
  /** Suma de `cabezas` de las líneas de `compra_categorias` — mismo cálculo que `CerrarCompra`. */
  cabezasCompradas: number;
  /** Garrones DISTINTOS vendidos (sin contar `compensacion_kg`) — mismo criterio que `CerrarCompra`. */
  cabezasVendidas: number;
  /** `cabezasCompradas - cabezasVendidas`. */
  stockRestante: number;
  /**
   * Categorías de esta tropa con sus cabezas compradas (línea a línea de
   * `compra_categorias`, sin cruzar contra lo vendido) — para que quien
   * planifica el reparto sepa de qué tipo es el stock que queda (ej. si la
   * tropa tiene "Cerda / Chancha" o "Capón"/"Machos Enteros
   * Inmunocastrados"), no solo cuánto.
   */
  categorias: StockTropaCategoria[];
}
