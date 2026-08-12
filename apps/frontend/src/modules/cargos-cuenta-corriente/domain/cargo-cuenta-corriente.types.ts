/**
 * Espejo de `apps/backend/src/modules/cargos-cuenta-corriente/domain/*`.
 */

/** Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`). */
export const TipoCargo = {
  RECARGO_CHEQUE: "recargo_cheque",
  COMISION_RECHAZO: "comision_rechazo",
  OTRO: "otro",
} as const;
export type TipoCargo = (typeof TipoCargo)[keyof typeof TipoCargo];

export const TIPO_CARGO_LABELS: Record<TipoCargo, string> = {
  [TipoCargo.RECARGO_CHEQUE]: "Recargo por cheque a más de 7 días",
  [TipoCargo.COMISION_RECHAZO]: "Comisión por cheque rechazado",
  [TipoCargo.OTRO]: "Otro",
};

/** Plata que el cliente pasa a deber sin que haya una Venta/Boleta de por medio — siempre confirmado a mano. */
export interface CargoCuentaCorriente {
  id: string;
  empresaId: string;
  clienteId: string;
  tipo: TipoCargo;
  monto: number;
  chequeId: string | null;
  motivo: string | null;
  fecha: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
