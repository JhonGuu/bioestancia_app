export enum EstadoEjercicio {
  ABIERTO = "abierto",
  CERRADO = "cerrado",
}

export enum EstadoPeriodo {
  ABIERTO = "abierto",
  CERRADO = "cerrado",
}

/**
 * Ejercicio contable de una empresa. Es por empresa a propósito: El
 * Meridiano cierra en diciembre y Bioestancia en mayo, así que cada una
 * lleva su propia numeración y sus propias fechas sin pisarse.
 */
export interface Ejercicio {
  id: string;
  empresaId: string;
  /** Número correlativo del ejercicio dentro de la empresa (1, 2, 3...). */
  numero: number;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoEjercicio;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Período mensual dentro de un ejercicio. Cerrar un período congela sus
 * asientos: es la única barrera dura del sistema (todo lo demás es
 * editable). Los asientos automáticos dejan de regenerarse ahí.
 */
export interface Periodo {
  id: string;
  ejercicioId: string;
  anio: number;
  /** 1..12 */
  mes: number;
  estado: EstadoPeriodo;
  cerradoAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Genera los períodos mensuales que cubren un ejercicio, de la fecha de
 * inicio a la de fin, ambas inclusive.
 *
 * Se calcula sobre UTC porque las fechas del sistema se guardan así (mismo
 * criterio que el resto de los módulos, ver `timeZone: "UTC"` en el
 * frontend): usar la zona local haría que un ejercicio que arranca el 1°
 * genere un período de más del mes anterior.
 */
export function generarPeriodos(fechaInicio: Date, fechaFin: Date): { anio: number; mes: number }[] {
  const periodos: { anio: number; mes: number }[] = [];
  let anio = fechaInicio.getUTCFullYear();
  let mes = fechaInicio.getUTCMonth() + 1;
  const anioFin = fechaFin.getUTCFullYear();
  const mesFin = fechaFin.getUTCMonth() + 1;

  while (anio < anioFin || (anio === anioFin && mes <= mesFin)) {
    periodos.push({ anio, mes });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }

  return periodos;
}
