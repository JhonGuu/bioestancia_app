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
  /**
   * El cliente cancela (total o parcialmente) sin que se mueva plata: se
   * compensa contra otra cosa (mercadería, un servicio, un arreglo
   * puntual). No lleva banco/billetera ni genera un `Cheque` — se trata
   * igual que EFECTIVO en cuanto a los datos que pide `LineaCobro`.
   */
  COMPENSACION = "compensacion",
}

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  [MedioPago.EFECTIVO]: "Efectivo",
  [MedioPago.TRANSFERENCIA_BANCO]: "Transferencia bancaria",
  [MedioPago.BILLETERA_VIRTUAL]: "Billetera virtual",
  [MedioPago.CHEQUE]: "Cheque",
  [MedioPago.ECHEQ]: "Echeq",
  [MedioPago.COMPENSACION]: "Compensación",
};

/** CHEQUE y ECHEQ son los únicos medios que generan un `Cheque` (ver `modules/cheques`). */
export function esMedioPagoCheque(medioPago: MedioPago): boolean {
  return medioPago === MedioPago.CHEQUE || medioPago === MedioPago.ECHEQ;
}

/** TRANSFERENCIA_BANCO y BILLETERA_VIRTUAL son los únicos medios con banco/billetera + remitente (ver `LineaCobro`). */
export function esMedioPagoTransferencia(medioPago: MedioPago): boolean {
  return medioPago === MedioPago.TRANSFERENCIA_BANCO || medioPago === MedioPago.BILLETERA_VIRTUAL;
}
