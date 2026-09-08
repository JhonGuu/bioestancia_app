/** Espejo de `apps/backend/src/modules/contabilidad/domain/regla-asiento.ts`. */
export const EventoAsiento = {
  BOLETA_FACTURADA: "boleta_facturada",
  COBRO_REGISTRADO: "cobro_registrado",
  CHEQUE_DEPOSITADO: "cheque_depositado",
  CARGO_RECARGO_CHEQUE: "cargo_recargo_cheque",
  CARGO_RECHAZO_CHEQUE: "cargo_rechazo_cheque",
  CARGO_COMISION_RECHAZO: "cargo_comision_rechazo",
  CARGO_OTRO: "cargo_otro",
  COMPRA_TROPA: "compra_tropa",
  LIQUIDACION_COMPRA: "liquidacion_compra",
  LIQUIDACION_FAENA: "liquidacion_faena",
} as const;
export type EventoAsiento = (typeof EventoAsiento)[keyof typeof EventoAsiento];

export const EVENTOS_ASIENTO_LABELS: Record<EventoAsiento, string> = {
  [EventoAsiento.BOLETA_FACTURADA]: "Boleta facturada (venta con precio)",
  [EventoAsiento.COBRO_REGISTRADO]: "Cobro registrado",
  [EventoAsiento.CHEQUE_DEPOSITADO]: "Cheque depositado",
  [EventoAsiento.CARGO_RECARGO_CHEQUE]: "Recargo por cheque a más de 7 días",
  [EventoAsiento.CARGO_RECHAZO_CHEQUE]: "Reversión por cheque rechazado",
  [EventoAsiento.CARGO_COMISION_RECHAZO]: "Comisión por cheque rechazado",
  [EventoAsiento.CARGO_OTRO]: "Cargo manual en cuenta corriente",
  [EventoAsiento.COMPRA_TROPA]: "Compra de tropa",
  [EventoAsiento.LIQUIDACION_COMPRA]: "Liquidación de compra",
  [EventoAsiento.LIQUIDACION_FAENA]: "Liquidación de faena",
};

/** Campos numéricos válidos como `expresion` de una línea — varían según el evento. */
export type ExpresionMontoRegla =
  | "monto"
  | "importeBruto"
  | "importeIva"
  | "totalGastos"
  | "ivaSobreGastos"
  | "totalTributos"
  | "total";

export const EXPRESION_LABELS: Record<ExpresionMontoRegla, string> = {
  monto: "Monto",
  importeBruto: "Importe bruto",
  importeIva: "IVA sobre el bruto",
  totalGastos: "Total de gastos",
  ivaSobreGastos: "IVA sobre gastos",
  totalTributos: "Total de tributos",
  total: "Total",
};

/** De dónde sale el auxiliar de una línea. Los mismos valores que `TipoAuxiliar` (ver `tipo-auxiliar.ts`) — se reutilizan sus labels. */
export type AuxiliarResolverRegla = "cliente" | "proveedor" | "frigorifico" | "cheque";

export type LadoLineaRegla = "debe" | "haber";

export interface ReglaAsientoLinea {
  id: string;
  reglaId: string;
  orden: number;
  lado: LadoLineaRegla;
  cuentaId: string;
  expresion: ExpresionMontoRegla;
  auxiliarResolver: AuxiliarResolverRegla | null;
}

export interface ReglaAsiento {
  id: string;
  empresaId: string;
  evento: EventoAsiento;
  nombre: string;
  activa: boolean;
  prioridad: number;
  /** Ej. `{"medioPago": "efectivo"}` — todas las claves tienen que matchear. `null`/vacío = siempre aplica. */
  condicion: Record<string, string> | null;
  lineas: ReglaAsientoLinea[];
}

/** Respuesta de `GET /contabilidad/reglas-asiento/eventos` — qué expresión/auxiliar tiene sentido para cada evento. */
export interface EventoAsientoInfo {
  evento: EventoAsiento;
  etiqueta: string;
  expresiones: ExpresionMontoRegla[];
  auxiliares: AuxiliarResolverRegla[];
}
