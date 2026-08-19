/** Espejo de `apps/backend/src/modules/personal/domain/horario-empleado.ts`. */
export interface HorarioEmpleado {
  id: string;
  empleadoId: string;
  /** 0 = domingo ... 6 = sábado (igual que `Date.getDay()`). */
  diaSemana: number;
  /** "HH:mm" — null junto con `horaSalida` en null significa franco ese día. */
  horaEntrada: string | null;
  horaSalida: string | null;
}
