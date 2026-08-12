/**
 * Medios de pago con los que un cliente puede cancelar (total o
 * parcialmente) un `Cobro`. Un mismo cobro puede combinar varios — ej. una
 * parte en efectivo y una parte con un cheque — por eso vive en
 * `LineaCobro.medioPago`, no en `Cobro`.
 */
export enum MedioPago {
  EFECTIVO = "efectivo",
  TRANSFERENCIA_BANCO = "transferencia_banco",
  BILLETERA_VIRTUAL = "billetera_virtual",
  CHEQUE = "cheque",
  ECHEQ = "echeq",
}

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  [MedioPago.EFECTIVO]: "Efectivo",
  [MedioPago.TRANSFERENCIA_BANCO]: "Transferencia bancaria",
  [MedioPago.BILLETERA_VIRTUAL]: "Billetera virtual",
  [MedioPago.CHEQUE]: "Cheque",
  [MedioPago.ECHEQ]: "Echeq",
};

/** CHEQUE y ECHEQ son los únicos medios que generan un `Cheque` (ver `modules/cheques`). */
export function esMedioPagoCheque(medioPago: MedioPago): boolean {
  return medioPago === MedioPago.CHEQUE || medioPago === MedioPago.ECHEQ;
}
