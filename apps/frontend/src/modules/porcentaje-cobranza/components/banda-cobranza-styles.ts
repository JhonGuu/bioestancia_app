import { BandaCobranza } from "@/modules/porcentaje-cobranza/domain/porcentaje-cobranza.types";

/**
 * Colores por banda — misma semántica que el formato condicional de
 * "VENTAS 2026.xlsm" (🔵 adelantado · 🟢 excelente · 🟩 bueno · 🟡 medio ·
 * 🔴 bajo), pero con la paleta clara/oscura de Tailwind que ya usa el resto
 * de la app (`bg-*-50`/`text-*-700` en claro, `dark:bg-*-500/15`/
 * `dark:text-*-400` en oscuro — ver `movimientos-cuenta-corriente-list.tsx`)
 * en vez de los hex fijos del Excel, que estaban pensados para un Excel en
 * tema oscuro y no se leerían bien en modo claro.
 */
export const BANDA_COBRANZA_CLASSNAME: Record<BandaCobranza, string> = {
  [BandaCobranza.ADELANTADO]: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  [BandaCobranza.EXCELENTE]: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  [BandaCobranza.BUENO]: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  [BandaCobranza.MEDIO]: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  [BandaCobranza.BAJO]: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

/** Sin banda (no había saldo pendiente al empezar la semana) — celda neutra. */
export const SIN_BANDA_CLASSNAME = "bg-muted/40 text-muted-foreground";
