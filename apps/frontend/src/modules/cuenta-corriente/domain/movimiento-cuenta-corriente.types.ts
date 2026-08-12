/**
 * Espejo de `apps/backend/src/modules/cuenta-corriente/domain/movimiento-cuenta-corriente.ts`.
 */

/** Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`). */
export const TipoMovimientoCuentaCorriente = {
  BOLETA: "boleta",
  COBRO: "cobro",
  /** Recargo por cheque a más de 7 días o comisión por cheque rechazado — ver `modules/cheques`. */
  CARGO: "cargo",
} as const;
export type TipoMovimientoCuentaCorriente =
  (typeof TipoMovimientoCuentaCorriente)[keyof typeof TipoMovimientoCuentaCorriente];

export const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimientoCuentaCorriente, string> = {
  [TipoMovimientoCuentaCorriente.BOLETA]: "Boleta",
  [TipoMovimientoCuentaCorriente.COBRO]: "Cobro",
  [TipoMovimientoCuentaCorriente.CARGO]: "Cargo",
};

/**
 * Un renglón del resumen de cuenta de un cliente — mezcla boletas (deuda),
 * cobros (pago) y cargos (recargo/comisión, deuda), más reciente primero,
 * con el saldo corriente después de cada uno.
 */
export interface MovimientoCuentaCorriente {
  tipo: TipoMovimientoCuentaCorriente;
  fecha: string;
  boletaId: string | null;
  cobroId: string | null;
  cargoId: string | null;
  /** Monto de la boleta/cargo (deuda) o del cobro (pago) — siempre positivo. */
  monto: number;
  /** Solo en movimientos BOLETA: lo que queda pendiente de esa boleta puntual. */
  saldoPendiente: number | null;
  /** Solo en movimientos BOLETA. */
  fechaVencimiento: string | null;
  /** Saldo total del cliente inmediatamente después de este movimiento. */
  saldoCorriente: number;
}
