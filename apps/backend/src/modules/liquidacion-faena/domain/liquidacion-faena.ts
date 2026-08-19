/**
 * Liquidación de faena: lo que el FRIGORÍFICO les cobra por faenar una
 * tropa (canon por animal — distinto de `liquidacion-compra`, que es lo que
 * ELLOS le facturan al proveedor/criadero).
 *
 * 1 a 1 con `Compra` (`compraId` único) — mismo criterio que `ResultadoFaena`:
 * se factura toda la tropa faenada de una vez, no en tandas.
 *
 * El canon suele variar por categoría (ej. Capón/MEI/Cachorra vs
 * Chancha/Cerda) y ya combina lo facturado + lo efectivo en un solo monto
 * (no se separan esos dos componentes, ver `use-cases/create-liquidacion-faena.use-case.ts`).
 * `total` se calcula en el server como la suma de los subtotales de cada
 * línea de `CompraCategoria` (`canonFaenaSubtotal`) — nunca se recibe del
 * cliente HTTP.
 */
export interface LiquidacionFaena {
  id: string;
  compraId: string;
  /** Establecimiento faenador (ver `modules/frigorificos`). */
  frigorificoId: string | null;
  fecha: Date;
  comentarios: string | null;
  total: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
