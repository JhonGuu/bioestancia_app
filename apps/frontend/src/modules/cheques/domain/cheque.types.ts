/**
 * Espejo de `apps/backend/src/modules/cheques/domain/*`.
 */

/**
 * Estados de un cheque/echeq entregado por un cliente, en el orden típico
 * de su ciclo de vida (aunque no se fuerza una transición estricta — se
 * puede cambiar a cualquier estado). Objeto `as const` en vez de `enum`
 * (ver comentario en `auth.types.ts`).
 */
export const EstadoCheque = {
  EN_CARTERA: "en_cartera",
  DEPOSITADO: "depositado",
  ACREDITADO: "acreditado",
  RECHAZADO: "rechazado",
  ENDOSADO_A_TERCEROS: "endosado_a_terceros",
} as const;
export type EstadoCheque = (typeof EstadoCheque)[keyof typeof EstadoCheque];

export const ESTADO_CHEQUE_LABELS: Record<EstadoCheque, string> = {
  [EstadoCheque.EN_CARTERA]: "En cartera",
  [EstadoCheque.DEPOSITADO]: "Depositado",
  [EstadoCheque.ACREDITADO]: "Acreditado",
  [EstadoCheque.RECHAZADO]: "Rechazado",
  [EstadoCheque.ENDOSADO_A_TERCEROS]: "Endosado a terceros",
};

/** Variante de `Badge` para cada estado — ver `components/ui/badge.tsx`. */
export const ESTADO_CHEQUE_BADGE_VARIANT: Record<
  EstadoCheque,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [EstadoCheque.EN_CARTERA]: "outline",
  [EstadoCheque.DEPOSITADO]: "secondary",
  [EstadoCheque.ACREDITADO]: "default",
  [EstadoCheque.RECHAZADO]: "destructive",
  [EstadoCheque.ENDOSADO_A_TERCEROS]: "outline",
};

/**
 * Nace siempre de una `LineaCobro` CHEQUE/ECHEQ (ver `modules/cobros`), pero
 * se modela como entidad propia porque su ciclo de vida sigue después de
 * que el cobro ya cerró.
 */
export interface Cheque {
  id: string;
  empresaId: string;
  clienteId: string;
  numero: string;
  banco: string;
  cuitLibrador: string | null;
  titular: string | null;
  fechaEmision: string;
  /** Fecha de pago/vencimiento del cheque (no confundir con la fecha de la boleta o del cobro). */
  fechaPago: string;
  monto: number;
  estado: EstadoCheque;
  fechaUltimoCambioEstado: string;
  /** Solo se espera cargado cuando `estado === RECHAZADO`. */
  motivoRechazo: string | null;
  comentarios: string | null;
  createdAt: string;
  updatedAt: string;
}
