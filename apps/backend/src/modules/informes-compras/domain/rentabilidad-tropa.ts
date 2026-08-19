/**
 * Rentabilidad de una tropa: compara el costo total (lo que se le pagó al
 * proveedor + lo que cobró el frigorífico por faenar) contra el ingreso de
 * venta de la carne — el cálculo que armaba a mano el Excel original
 * ("COSTO NETO por kg de carne" vs "Precio promedio VENTA por kg").
 *
 * `costoCompra`/`costoFaena`/`costoTotal` son nullable: mientras falte
 * cargar la liquidación de compra y/o de faena de esa tropa, no hay costo
 * completo todavía — se muestra lo que hay, sin inventar ceros.
 * `ingresoVenta` en cambio nunca es null (0 si todavía no se vendió nada).
 */
export interface RentabilidadTropa {
  compraId: string;
  numero: string;
  letra: string | null;
  fecha: Date;
  proveedorId: string;
  cerrada: boolean;
  costoCompra: number | null;
  costoFaena: number | null;
  /** `costoCompra + costoFaena` — null solo si NINGUNO de los dos está cargado todavía. */
  costoTotal: number | null;
  ingresoVenta: number;
  /** `ingresoVenta - costoTotal` — null si `costoTotal` es null. */
  ganancia: number | null;
  /** `ganancia / costoTotal * 100` — null si `costoTotal` es null o 0. */
  rentabilidadPorcentaje: number | null;
}
