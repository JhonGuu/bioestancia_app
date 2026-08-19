/**
 * Horario pactado de un empleado para UN día de la semana (0 = domingo, ...,
 * 6 = sábado — mismo criterio que `Date.getDay()`). Sub-recurso de Empleado,
 * como `CompraCategoria` lo es de `Compra`.
 *
 * `horaEntrada`/`horaSalida` nulas = franco ese día. Se configura una vez por
 * empleado (horario fijo por día de semana, ver
 * `docs/plan-personal-asistencia.md` punto 4) y se edita solo cuando cambia
 * el pacto real — reemplaza la columna "Hora citada" que hoy se carga a mano
 * cada día en la planilla.
 */
export interface HorarioEmpleado {
  id: string;
  empleadoId: string;
  diaSemana: number;
  /** Formato "HH:mm". Null si ese día es franco. */
  horaEntrada: string | null;
  horaSalida: string | null;
}
