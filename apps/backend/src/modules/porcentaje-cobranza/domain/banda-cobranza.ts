/**
 * Banda de color del `% Cobr.` semanal — calcada de los umbrales de formato
 * condicional de "VENTAS 2026.xlsm" (hoja "Porcentaje de cobranza"):
 * 🔵 >110% cobro adelantado · 🟢 ≥90% excelente · 🟩 70-89% bueno ·
 * 🟡 50-69% medio · 🔴 <50% bajo.
 */
export enum BandaCobranza {
  ADELANTADO = "adelantado",
  EXCELENTE = "excelente",
  BUENO = "bueno",
  MEDIO = "medio",
  BAJO = "bajo",
}

export const BANDA_COBRANZA_LABELS: Record<BandaCobranza, string> = {
  [BandaCobranza.ADELANTADO]: "Cobro adelantado",
  [BandaCobranza.EXCELENTE]: "Excelente",
  [BandaCobranza.BUENO]: "Bueno",
  [BandaCobranza.MEDIO]: "Medio",
  [BandaCobranza.BAJO]: "Bajo",
};

/** Mismo orden que la leyenda del Excel (de mejor a peor), para pintar la referencia. */
export const BANDA_COBRANZA_ORDEN: readonly BandaCobranza[] = [
  BandaCobranza.ADELANTADO,
  BandaCobranza.EXCELENTE,
  BandaCobranza.BUENO,
  BandaCobranza.MEDIO,
  BandaCobranza.BAJO,
];

/**
 * `porcentaje === null` (no había saldo pendiente al empezar la semana, no
 * hay nada que medir) no tiene banda — se muestra en blanco, igual que el
 * `IFERROR` del Excel.
 */
export function calcularBandaCobranza(porcentaje: number | null): BandaCobranza | null {
  if (porcentaje === null) return null;
  if (porcentaje > 1.1) return BandaCobranza.ADELANTADO;
  if (porcentaje >= 0.9) return BandaCobranza.EXCELENTE;
  if (porcentaje >= 0.7) return BandaCobranza.BUENO;
  if (porcentaje >= 0.5) return BandaCobranza.MEDIO;
  return BandaCobranza.BAJO;
}
