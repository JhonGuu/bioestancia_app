import type { RangoFechas } from "@/shared/lib/rango-fechas";

/**
 * Semana del año, estándar ISO 8601 — mismo algoritmo que el backend
 * (`apps/backend/src/shared/domain/semana-iso.ts`, ver el comentario ahí
 * para el porqué): semanas de lunes a domingo, la semana 1 es la que
 * contiene el primer jueves del año. Es el mismo criterio que ya usa
 * "Porcentaje de cobranza" — el negocio piensa el calendario en números de
 * semana, no en fechas sueltas, así que los filtros de rango de fecha
 * arrancan siempre por acá.
 */
export interface SemanaIso {
  anio: number;
  semana: number;
}

function aMedianocheUtc(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

/** A qué semana ISO (y año ISO) pertenece `fecha`. */
export function obtenerSemanaIso(fecha: Date): SemanaIso {
  const dia = aMedianocheUtc(fecha);
  const diaDeLaSemana = dia.getUTCDay() || 7; // lunes=1 .. domingo=7
  dia.setUTCDate(dia.getUTCDate() + 4 - diaDeLaSemana);
  const inicioDeAnio = new Date(Date.UTC(dia.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((dia.getTime() - inicioDeAnio.getTime()) / 86_400_000 + 1) / 7);
  return { anio: dia.getUTCFullYear(), semana };
}

/** Semana ISO en la que cae HOY, según el calendario local del navegador. */
export function semanaIsoActual(): SemanaIso {
  return obtenerSemanaIso(new Date());
}

function primerLunesDeAnioIso(anio: number): Date {
  const cuatroDeEnero = new Date(Date.UTC(anio, 0, 4));
  const diaDeLaSemana = cuatroDeEnero.getUTCDay() || 7;
  cuatroDeEnero.setUTCDate(cuatroDeEnero.getUTCDate() - (diaDeLaSemana - 1));
  return cuatroDeEnero;
}

function aISO(fecha: Date): string {
  const yyyy = fecha.getUTCFullYear();
  const mm = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Lunes (inclusive) a domingo (inclusive) de una semana ISO puntual. */
export function fechasDeSemanaIso({ anio, semana }: SemanaIso): RangoFechas {
  const desde = primerLunesDeAnioIso(anio);
  desde.setUTCDate(desde.getUTCDate() + (semana - 1) * 7);
  const hasta = new Date(desde);
  hasta.setUTCDate(hasta.getUTCDate() + 6);
  return { desde: aISO(desde), hasta: aISO(hasta) };
}

/**
 * Rango que va del lunes de `semanaDesde` al domingo de `semanaHasta`
 * (mismo año) — si `semanaHasta` no viene, se toma como una sola semana
 * (`semanaDesde`). Mismo par de campos "Semana desde/hasta" que ya existe
 * en la tabla de "Porcentaje de cobranza".
 */
export function rangoDeSemanasIso(anio: number, semanaDesde: number, semanaHasta?: number): RangoFechas {
  const { desde } = fechasDeSemanaIso({ anio, semana: semanaDesde });
  const { hasta } = fechasDeSemanaIso({ anio, semana: semanaHasta ?? semanaDesde });
  return { desde, hasta };
}
