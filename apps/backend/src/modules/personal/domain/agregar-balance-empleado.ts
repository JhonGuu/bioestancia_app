import { BalanceHorasEmpleado } from "@/modules/personal/domain/balance-horas";
import { EstadoJornada, Jornada } from "@/modules/personal/domain/jornada";

function redondear2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Suma las `Jornada[]` ya calculadas de UN empleado dentro de un período —
 * cálculo puro, sin I/O (ver `docs/plan-personal-asistencia.md`, punto 8).
 * Reemplaza a la hoja "RECUENTO DE HORAS".
 */
export function agregarBalanceEmpleado(
  empleadoId: string,
  empleadoNombre: string,
  cargoNombre: string | null,
  jornadas: Jornada[],
): BalanceHorasEmpleado {
  return {
    empleadoId,
    empleadoNombre,
    cargoNombre,
    horasNormales: redondear2(jornadas.reduce((acc, j) => acc + j.horasNormales, 0)),
    horasExtra: redondear2(jornadas.reduce((acc, j) => acc + j.horasExtra, 0)),
    cantidadFaltas: jornadas.filter((j) => j.estado === EstadoJornada.FALTA).length,
    cantidadLlegadasTarde: jornadas.filter((j) => j.llegadaTarde).length,
    cantidadMarcacionesIncompletas: jornadas.filter((j) => j.estado === EstadoJornada.MARCACION_INCOMPLETA)
      .length,
  };
}
