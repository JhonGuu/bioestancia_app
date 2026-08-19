import { HorarioEmpleado } from "@/modules/personal/domain/horario-empleado";

/**
 * Interface del repositorio de HorarioEmpleado. Forma parte del DOMINIO.
 *
 * No hay `create`/`update`/`delete` por fila individual: el horario semanal
 * se reemplaza siempre completo (`setHorarios`) — más simple que upserts
 * día por día, y coherente con cómo se va a editar desde la pantalla
 * (una grilla de 7 días a la vez).
 */
export interface HorarioEmpleadoRepository {
  /** Los 7 (o menos, si nunca se configuraron todos) horarios de un empleado. */
  listByEmpleado(empleadoId: string): Promise<HorarioEmpleado[]>;

  /**
   * Reemplaza TODO el horario semanal del empleado por el array dado
   * (borra lo anterior e inserta lo nuevo, en una sola operación). Cada
   * entrada es un día de la semana (0-6); días no incluidos quedan sin
   * horario configurado (se interpretan como franco).
   */
  setHorarios(empleadoId: string, horarios: SetHorarioInput[]): Promise<HorarioEmpleado[]>;

  /** Borra todos los horarios de un empleado. Lo usa `DeleteEmpleado` si hiciera falta limpiar (hoy no se llama, se deja por completitud). */
  deleteByEmpleado(empleadoId: string): Promise<void>;
}

export interface SetHorarioInput {
  diaSemana: number;
  horaEntrada: string | null;
  horaSalida: string | null;
}
