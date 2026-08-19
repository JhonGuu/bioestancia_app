/**
 * Espejo de `apps/backend/src/modules/porcentaje-cobranza/domain/*`.
 */

/**
 * Banda de color del `% Cobr.` semanal — objeto `as const` en vez de `enum`
 * (ver comentario en `auth.types.ts`).
 */
export const BandaCobranza = {
  ADELANTADO: "adelantado",
  EXCELENTE: "excelente",
  BUENO: "bueno",
  MEDIO: "medio",
  BAJO: "bajo",
} as const;
export type BandaCobranza = (typeof BandaCobranza)[keyof typeof BandaCobranza];

export const BANDA_COBRANZA_LABELS: Record<BandaCobranza, string> = {
  [BandaCobranza.ADELANTADO]: "Cobro adelantado",
  [BandaCobranza.EXCELENTE]: "Excelente",
  [BandaCobranza.BUENO]: "Bueno",
  [BandaCobranza.MEDIO]: "Medio",
  [BandaCobranza.BAJO]: "Bajo",
};

/** Emoji + umbral, igual que la leyenda de "VENTAS 2026.xlsm" (hoja "Porcentaje de cobranza"). */
export const BANDA_COBRANZA_EMOJI: Record<BandaCobranza, string> = {
  [BandaCobranza.ADELANTADO]: "🔵",
  [BandaCobranza.EXCELENTE]: "🟢",
  [BandaCobranza.BUENO]: "🟩",
  [BandaCobranza.MEDIO]: "🟡",
  [BandaCobranza.BAJO]: "🔴",
};

export const BANDA_COBRANZA_UMBRAL: Record<BandaCobranza, string> = {
  [BandaCobranza.ADELANTADO]: ">110%",
  [BandaCobranza.EXCELENTE]: "≥90%",
  [BandaCobranza.BUENO]: "70-89%",
  [BandaCobranza.MEDIO]: "50-69%",
  [BandaCobranza.BAJO]: "<50%",
};

export const BANDA_COBRANZA_ORDEN: readonly BandaCobranza[] = [
  BandaCobranza.ADELANTADO,
  BandaCobranza.EXCELENTE,
  BandaCobranza.BUENO,
  BandaCobranza.MEDIO,
  BandaCobranza.BAJO,
];

export interface SemanaCobranza {
  anio: number;
  semana: number;
  fechaDesde: string;
  fechaHasta: string;
  vendido: number;
  cobrado: number;
  saldoInicio: number;
  porcentaje: number | null;
  banda: BandaCobranza | null;
  remanente: number;
}

export interface PorcentajeCobranzaCliente {
  clienteId: string;
  semanas: SemanaCobranza[];
}
