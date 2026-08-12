import { Venta } from "@/modules/ventas/domain/venta";

export interface MontoBoleta {
  /** `true` solo si TODAS las ventas de la boleta ya tienen `precioKg` cargado. */
  facturada: boolean;
  /** Suma de `total` de las ventas — `0` si la boleta no está `facturada` todavía. */
  monto: number;
}

/**
 * Calcula el monto real de una boleta a partir de sus ventas — lo usan tanto
 * `AplicarCobroFifo` como `modules/cuenta-corriente` para saber cuánto le
 * corresponde pagar al cliente por esa boleta.
 *
 * Una boleta con alguna venta "pendiente de precio" (`precioKg === null`) NO
 * participa del cálculo de saldo todavía — devuelve `monto: 0` — hasta que
 * administración/contable complete el precio de todas sus ventas
 * (`SetPrecioVenta`).
 */
export function calcularMontoBoleta(ventasDeLaBoleta: Venta[]): MontoBoleta {
  const facturada = ventasDeLaBoleta.length > 0 && ventasDeLaBoleta.every((v) => v.precioKg !== null);
  const monto = facturada ? ventasDeLaBoleta.reduce((acc, v) => acc + (v.total ?? 0), 0) : 0;
  return { facturada, monto };
}
