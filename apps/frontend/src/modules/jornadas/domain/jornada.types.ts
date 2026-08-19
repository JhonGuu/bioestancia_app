/** Espejo de `apps/backend/src/modules/personal/domain/jornada.ts`. */
export const EstadoJornada = {
  PRESENTE: "presente",
  FALTA: "falta",
  FRANCO: "franco",
  MARCACION_INCOMPLETA: "marcacion_incompleta",
} as const;
export type EstadoJornada = (typeof EstadoJornada)[keyof typeof EstadoJornada];

export interface FichajeCrudo {
  id: string;
  empresaId: string;
  empleadoId: string;
  momento: string;
  tipo: "entrada" | "salida";
  origen: "importado" | "manual";
  createdAt: string;
}

export interface ParFichaje {
  entrada: FichajeCrudo | null;
  salida: FichajeCrudo | null;
}

export interface Jornada {
  empleadoId: string;
  /** "YYYY-MM-DD" (UTC, sin hora). */
  fecha: string;
  estado: EstadoJornada;
  horarioPactado: { horaEntrada: string | null; horaSalida: string | null } | null;
  pares: ParFichaje[];
  horasTrabajadas: number;
  horasNormales: number;
  horasExtra: number;
  llegadaTarde: boolean;
  toleranciaAplicadaMinutos: number;
  tieneMarcacionManual: boolean;
}
