import { EstadoJornada } from "@/modules/jornadas/domain/jornada.types";

export const ESTADO_JORNADA_LABELS: Record<EstadoJornada, string> = {
  [EstadoJornada.PRESENTE]: "Presente",
  [EstadoJornada.FALTA]: "Falta",
  [EstadoJornada.FRANCO]: "Franco",
  [EstadoJornada.MARCACION_INCOMPLETA]: "Marcación incompleta",
};

/** Clases de color para el Badge (variant="outline" + estas clases), igual al patrón de `banda-cobranza-styles.ts`. */
export const ESTADO_JORNADA_BADGE_CLASSNAME: Record<EstadoJornada, string> = {
  [EstadoJornada.PRESENTE]: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  [EstadoJornada.FALTA]: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  [EstadoJornada.FRANCO]: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400",
  [EstadoJornada.MARCACION_INCOMPLETA]:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};
