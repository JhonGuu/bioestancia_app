/**
 * Espejo de las respuestas de `/cobros/cheques/:chequeId/*` en el backend
 * (`apps/backend/src/modules/cobros/use-cases/{sugerir,confirmar}-*.ts`) —
 * viven bajo `modules/cobros` en el backend (dependencia con `cheques`),
 * pero conceptualmente son acciones sobre un cheque, por eso el espejo
 * frontend queda acá.
 */

/** Resultado de `GET /cobros/cheques/:chequeId/sugerencia-recargo` — solo cálculo, no persiste nada. */
export interface SugerenciaRecargoCheque {
  chequeId: string;
  clienteId: string;
  dias: number;
  corresponde: boolean;
  porcentaje: number;
  montoCheque: number;
  montoSugerido: number;
  /** `true` si ya se confirmó este recargo antes — no se puede confirmar de nuevo. */
  yaConfirmado: boolean;
}

/** Resultado de `GET /cobros/cheques/:chequeId/sugerencia-rechazo` — solo cálculo, no persiste nada. */
export interface SugerenciaReversionChequeRechazado {
  chequeId: string;
  clienteId: string;
  montoCheque: number;
  /** Hasta cuánto se revertiría de boletas ya dadas por cobradas con este cheque. */
  montoARevertir: number;
  porcentajeComision: number;
  comisionSugerida: number;
  /** `true` si ya se confirmó esta reversión/comisión antes — no se puede confirmar de nuevo. */
  yaConfirmado: boolean;
}

/** Espejo mínimo de `CargoCuentaCorriente` — lo que devuelven las confirmaciones. */
export interface CargoCuentaCorriente {
  id: string;
  empresaId: string;
  clienteId: string;
  tipo: string;
  monto: number;
  chequeId: string | null;
  motivo: string | null;
  fecha: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Resultado de `POST /cobros/cheques/:chequeId/confirmar-rechazo`. */
export interface ResultadoConfirmarRechazoCheque {
  /** Cargo de la comisión del 7% — `null` si se omitió (cliente canceló el cheque el mismo día). */
  cargoComision: CargoCuentaCorriente | null;
  /** Línea informativa "Cheque rechazo Nº: X" — siempre se crea. */
  cargoRechazo: CargoCuentaCorriente;
  /** Cuánto se pudo revertir realmente de lo aplicado a boletas (puede ser menor al monto del cheque). */
  montoRevertido: number;
}
