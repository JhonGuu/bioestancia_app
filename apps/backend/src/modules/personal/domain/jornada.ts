import { Fichaje } from "@/modules/personal/domain/fichaje";

/**
 * Estado de la jornada de un empleado en un día puntual — ver
 * `docs/plan-personal-asistencia.md`, punto 7.
 */
export const EstadoJornada = {
  PRESENTE: "presente",
  /** Tenía horario pactado ese día y no marcó ningún fichaje. */
  FALTA: "falta",
  /** No tenía horario pactado ese día (y no marcó nada). */
  FRANCO: "franco",
  /** Quedó una entrada sin su salida (o una salida sin su entrada) — típicamente un olvido de marcar. */
  MARCACION_INCOMPLETA: "marcacion_incompleta",
} as const;
export type EstadoJornada = (typeof EstadoJornada)[keyof typeof EstadoJornada];

/** Un par entrada/salida del día. Si falta uno de los dos lados, la jornada queda `marcacion_incompleta`. */
export interface ParFichaje {
  entrada: Fichaje | null;
  salida: Fichaje | null;
}

/**
 * Resultado del cálculo de jornada para un empleado en un día — se computa
 * en memoria a partir de sus `Fichaje` crudos, nunca se persiste (mismo
 * criterio que `RentabilidadTropa`).
 */
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
  /** La primera entrada del día llegó después de la tolerancia vigente. */
  llegadaTarde: boolean;
  /** Tolerancia (en minutos) efectivamente usada — resultado de la cascada empleado→cargo→empresa. */
  toleranciaAplicadaMinutos: number;
  /** Al menos uno de los fichajes del día se cargó a mano (ver `Fichaje.origen`) — se muestra como rastro visible aunque ya no esté incompleto. */
  tieneMarcacionManual: boolean;
}
