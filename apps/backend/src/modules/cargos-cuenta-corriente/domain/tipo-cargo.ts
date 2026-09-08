/**
 * Tipo de un cargo adicional en la cuenta corriente de un cliente — plata
 * que el cliente pasa a deber sin que haya una `Venta`/`Boleta` de por
 * medio. Nace siempre de una decisión de administración/contable,
 * confirmada a mano (no se cobra nada automáticamente — ver
 * `modules/cobros/use-cases/confirmar-recargo-cheque.use-case.ts` y
 * `confirmar-rechazo-cheque.use-case.ts`).
 */
export enum TipoCargo {
  /** 5% sobre el monto de un cheque entregado a más de 7 días de la fecha de cobro. */
  RECARGO_CHEQUE = "recargo_cheque",
  /** 7% sobre el monto de un cheque que se marcó `RECHAZADO`. Opcional — ver `ConfirmarRechazoCheque`. */
  COMISION_RECHAZO = "comision_rechazo",
  /**
   * Línea informativa que deja registro visible en la cuenta corriente de
   * que un cheque se rechazó (`ConfirmarRechazoCheque`) — SIEMPRE se crea
   * (con comisión o sin ella), y también funciona como marcador de
   * idempotencia (no se puede confirmar el mismo rechazo dos veces). Su
   * `monto` es lo que se revirtió de boletas ya dadas por cobradas, pero NO
   * suma al saldo corriente acumulado (`impactoEnSaldo` la trata como 0):
   * ese efecto ya está reflejado en la reducción silenciosa de
   * `AplicacionCobro.monto` del cobro original — ver
   * `obtener-movimientos-cuenta-corriente.use-case.ts`.
   */
  CHEQUE_RECHAZADO = "cheque_rechazado",
  /**
   * Cualquier otro cargo manual (arreglos puntuales con el cliente, ajustes
   * por diferencia, etc). Es el único tipo cuyo `monto` puede ser negativo
   * — ej. un "ajuste por diferencia" que reduce la deuda del cliente en vez
   * de aumentarla.
   */
  OTRO = "otro",
}

export const TIPO_CARGO_LABELS: Record<TipoCargo, string> = {
  [TipoCargo.RECARGO_CHEQUE]: "Recargo por cheque a más de 7 días",
  [TipoCargo.COMISION_RECHAZO]: "Comisión por cheque rechazado",
  [TipoCargo.CHEQUE_RECHAZADO]: "Cheque rechazado",
  [TipoCargo.OTRO]: "Otro",
};
