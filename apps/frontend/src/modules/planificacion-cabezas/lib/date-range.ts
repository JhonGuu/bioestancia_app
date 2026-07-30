/**
 * Helpers de fechas para la vista de planificación de cabezas: navegación
 * por día/semana/mes, cálculo del "período anterior equivalente" (para la
 * columna de referencia) y formateo. Semana = lunes a domingo (convención
 * local). Nada de esto usa `toISOString()` para fechas "de calendario": esa
 * conversión pasa a UTC y puede correr el día si el desfase horario cruza
 * medianoche — siempre se arma el string `YYYY-MM-DD` a mano en horario local.
 */

export type Granularidad = "dia" | "semana" | "mes";

export interface RangoFechas {
  desde: Date;
  hasta: Date;
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function medianoche(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

function inicioSemana(fecha: Date): Date {
  const dia = medianoche(fecha);
  const diaSemana = dia.getDay();
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  dia.setDate(dia.getDate() + offset);
  return dia;
}

function finSemana(fecha: Date): Date {
  const fin = inicioSemana(fecha);
  fin.setDate(fin.getDate() + 6);
  return fin;
}

function inicioMes(fecha: Date): Date {
  const dia = medianoche(fecha);
  dia.setDate(1);
  return dia;
}

function finMes(fecha: Date): Date {
  const fin = inicioMes(fecha);
  fin.setMonth(fin.getMonth() + 1);
  fin.setDate(0);
  return fin;
}

export function rangoDe(cursor: Date, granularidad: Granularidad): RangoFechas {
  switch (granularidad) {
    case "dia": {
      const dia = medianoche(cursor);
      return { desde: dia, hasta: dia };
    }
    case "semana":
      return { desde: inicioSemana(cursor), hasta: finSemana(cursor) };
    case "mes":
      return { desde: inicioMes(cursor), hasta: finMes(cursor) };
  }
}

/**
 * Rango del "período anterior equivalente" — para día es el mismo día de la
 * semana pasada (más útil como referencia que "ayer"), para semana la semana
 * previa, para mes el mes previo.
 */
export function rangoAnterior(cursor: Date, granularidad: Granularidad): RangoFechas {
  const anterior = new Date(cursor);
  if (granularidad === "mes") {
    anterior.setMonth(anterior.getMonth() - 1);
  } else {
    anterior.setDate(anterior.getDate() - 7);
  }
  return rangoDe(anterior, granularidad);
}

export function navegar(cursor: Date, granularidad: Granularidad, direccion: 1 | -1): Date {
  const siguiente = new Date(cursor);
  if (granularidad === "dia") siguiente.setDate(siguiente.getDate() + direccion);
  if (granularidad === "semana") siguiente.setDate(siguiente.getDate() + 7 * direccion);
  if (granularidad === "mes") siguiente.setMonth(siguiente.getMonth() + direccion);
  return siguiente;
}

export function listaDias(rango: RangoFechas): Date[] {
  const dias: Date[] = [];
  const cursor = new Date(rango.desde);
  while (cursor <= rango.hasta) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
}

/** "YYYY-MM-DD" en horario local — el formato que espera la API en `desde`/`hasta`/`fecha`. */
export function formatoISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatoCorto(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function nombreDiaSemana(fecha: Date): string {
  return DIAS_SEMANA[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1];
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function etiquetaRango(rango: RangoFechas, granularidad: Granularidad): string {
  switch (granularidad) {
    case "dia":
      return capitalizar(
        rango.desde.toLocaleDateString("es-AR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        }),
      );
    case "semana":
      return `Semana del ${formatoCorto(rango.desde)} al ${formatoCorto(rango.hasta)}`;
    case "mes":
      return capitalizar(
        rango.desde.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
      );
  }
}

/** Etiqueta corta del período que se está viendo/editando ahora mismo (para la columna de totales). */
export function etiquetaPeriodoActual(granularidad: Granularidad): string {
  switch (granularidad) {
    case "dia":
      return "Este día";
    case "semana":
      return "Esta semana";
    case "mes":
      return "Este mes";
  }
}

export function etiquetaRangoAnterior(granularidad: Granularidad): string {
  switch (granularidad) {
    case "dia":
      return "Mismo día, semana pasada";
    case "semana":
      return "Semana pasada";
    case "mes":
      return "Mes anterior";
  }
}
