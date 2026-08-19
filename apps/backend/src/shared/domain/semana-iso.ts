/**
 * Semana del año, estándar ISO 8601: semanas de lunes a domingo, la semana 1
 * de un año es la que contiene el primer jueves de ese año (equivalente:
 * la que contiene el 4 de enero). Por eso la semana 1 de 2026 arranca el
 * lunes 29/12/2025 (contiene al 4/1/2026, que cae domingo) — es EXACTAMENTE
 * el criterio que ya usa el negocio para renovar la numeración semanal
 * (ver `modules/clientes/domain/cliente.ts`, `metaCabezasSemanales`), así
 * que no hace falta inventar nada: se usa esta implementación estándar en
 * vez de una a medida.
 *
 * Vive acá (no en un módulo puntual) porque "en qué semana del año estamos"
 * es un dato transversal — hoy lo usa la meta semanal de cabezas por
 * cliente, pero no es exclusivo de ese caso de uso.
 */
export interface SemanaIso {
  anio: number;
  semana: number;
}

/** Trunca una fecha a medianoche UTC — evita que la hora del día corra la cuenta de días. */
function aMedianocheUtc(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

/**
 * A qué semana ISO (y de qué año ISO — puede no coincidir con el año
 * calendario en los bordes de diciembre/enero) pertenece `fecha`.
 */
export function obtenerSemanaIso(fecha: Date): SemanaIso {
  const dia = aMedianocheUtc(fecha);
  // Lunes=1 ... domingo=7 (a diferencia de `getUTCDay()`, que da domingo=0).
  const diaDeLaSemana = dia.getUTCDay() || 7;
  // Se corre a jueves de ESTA semana: el año ISO es el año calendario de ese jueves.
  dia.setUTCDate(dia.getUTCDate() + 4 - diaDeLaSemana);
  const inicioDeAnio = new Date(Date.UTC(dia.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((dia.getTime() - inicioDeAnio.getTime()) / 86_400_000 + 1) / 7);
  return { anio: dia.getUTCFullYear(), semana };
}

/** Lunes (00:00 UTC) de la semana ISO 1 de `anio` — ver comentario de la clase. */
function primerLunesDeAnioIso(anio: number): Date {
  const cuatroDeEnero = new Date(Date.UTC(anio, 0, 4));
  const diaDeLaSemana = cuatroDeEnero.getUTCDay() || 7;
  cuatroDeEnero.setUTCDate(cuatroDeEnero.getUTCDate() - (diaDeLaSemana - 1));
  return cuatroDeEnero;
}

/**
 * Rango de fechas de una semana ISO puntual — `desde` inclusive (lunes 00:00
 * UTC), `hasta` EXCLUSIVE (el lunes siguiente), mismo criterio medio-abierto
 * que `BoletaRepository.listByRango`.
 */
export function rangoSemanaIso({ anio, semana }: SemanaIso): { desde: Date; hasta: Date } {
  const desde = primerLunesDeAnioIso(anio);
  desde.setUTCDate(desde.getUTCDate() + (semana - 1) * 7);
  const hasta = new Date(desde);
  hasta.setUTCDate(hasta.getUTCDate() + 7);
  return { desde, hasta };
}
