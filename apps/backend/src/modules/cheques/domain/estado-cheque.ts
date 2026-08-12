/**
 * Estados de un cheque/echeq entregado por un cliente, en el orden típico de
 * su ciclo de vida (aunque no se fuerza una transición estricta entre
 * estados — `ActualizarEstadoCheque` permite cualquier cambio).
 *
 * `RECHAZADO` es el único que pide un motivo (`Cheque.motivoRechazo`).
 */
export enum EstadoCheque {
  EN_CARTERA = "en_cartera",
  DEPOSITADO = "depositado",
  ACREDITADO = "acreditado",
  RECHAZADO = "rechazado",
  ENDOSADO_A_TERCEROS = "endosado_a_terceros",
}

export const ESTADO_CHEQUE_LABELS: Record<EstadoCheque, string> = {
  [EstadoCheque.EN_CARTERA]: "En cartera",
  [EstadoCheque.DEPOSITADO]: "Depositado",
  [EstadoCheque.ACREDITADO]: "Acreditado",
  [EstadoCheque.RECHAZADO]: "Rechazado",
  [EstadoCheque.ENDOSADO_A_TERCEROS]: "Endosado a terceros",
};
