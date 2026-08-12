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
  /** 7% sobre el monto de un cheque que se marcó `RECHAZADO`. */
  COMISION_RECHAZO = "comision_rechazo",
  /** Cualquier otro cargo manual (ajustes puntuales, etc). */
  OTRO = "otro",
}

export const TIPO_CARGO_LABELS: Record<TipoCargo, string> = {
  [TipoCargo.RECARGO_CHEQUE]: "Recargo por cheque a más de 7 días",
  [TipoCargo.COMISION_RECHAZO]: "Comisión por cheque rechazado",
  [TipoCargo.OTRO]: "Otro",
};
