import { hoyISO } from "@/shared/lib/date";

export { hoyISO };

/**
 * Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 */
export const PeriodoFiltro = {
  DIA: "dia",
  SEMANA: "semana",
  MES: "mes",
  ANIO: "anio",
  TODAS: "todas",
} as const;
export type PeriodoFiltro = (typeof PeriodoFiltro)[keyof typeof PeriodoFiltro];

export const PERIODO_FILTRO_LABELS: Record<PeriodoFiltro, string> = {
  [PeriodoFiltro.DIA]: "Día",
  [PeriodoFiltro.SEMANA]: "Semana",
  [PeriodoFiltro.MES]: "Mes",
  [PeriodoFiltro.ANIO]: "Año",
  [PeriodoFiltro.TODAS]: "Todas",
};

/**
 * Filtro genérico por período — originalmente vivía solo en
 * `modules/boletas/domain/filtro-periodo.ts`, extraído acá para
 * reutilizarlo tal cual en `modules/compras/domain/filtro-periodo-compras.ts`
 * (mismo criterio que se usó para `repartirProporcional`: lógica de negocio
 * real compartida se extrae a un util común, no se duplica).
 *
 * Todas las comparaciones de fecha acá usan los getters UTC
 * (`getUTCFullYear`/`getUTCMonth`/`getUTCDate`), NO los locales — a
 * propósito, para ser consistentes con cómo viajan las fechas del backend
 * (`Boleta.fecha`, `Compra.fecha`, etc.): un `<input type="date">` da
 * "YYYY-MM-DD" (calendario, sin hora), que al mandarse al backend se guarda
 * como medianoche UTC de ESE día — así que para filtrar/agrupar hay que leer
 * esa fecha con los getters UTC, no los locales (si no, en cualquier huso
 * horario distinto de UTC, como Argentina, una fecha "de hoy" podría
 * filtrarse como si fuera de ayer).
 *
 * OJO, esto es distinto de `hoyISO()` (`shared/lib/date.ts`): esa función
 * calcula qué día calendario ES HOY, y para eso sí tiene que usar la hora
 * LOCAL de quien está mirando la pantalla.
 */
function mismoDiaUTC(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Lunes de la semana (UTC) que contiene `fecha` — semana Argentina, lunes a domingo. */
export function inicioDeSemanaUTC(fecha: Date): Date {
  const dia = fecha.getUTCDay(); // 0 domingo .. 6 sábado
  const diff = (dia === 0 ? -6 : 1) - dia;
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate() + diff));
}

/**
 * Filtra `items` (cualquier cosa con un campo `fecha` tipo ISO) por
 * `periodo`, usando `fechaReferencia` ("YYYY-MM-DD") como el día que cae
 * dentro del día/semana/mes/año buscado. `"todas"` o una `fechaReferencia`
 * vacía/inválida devuelve la lista sin tocar.
 */
export function filtrarPorPeriodo<T extends { fecha: string }>(
  items: T[],
  periodo: PeriodoFiltro,
  fechaReferencia: string,
): T[] {
  if (periodo === PeriodoFiltro.TODAS || !fechaReferencia) return items;

  const referencia = new Date(fechaReferencia);
  if (isNaN(referencia.getTime())) return items;

  if (periodo === PeriodoFiltro.SEMANA) {
    const inicio = inicioDeSemanaUTC(referencia);
    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 7);
    return items.filter((item) => {
      const fecha = new Date(item.fecha);
      return fecha >= inicio && fecha < fin;
    });
  }

  return items.filter((item) => {
    const fecha = new Date(item.fecha);
    switch (periodo) {
      case PeriodoFiltro.DIA:
        return mismoDiaUTC(fecha, referencia);
      case PeriodoFiltro.MES:
        return (
          fecha.getUTCFullYear() === referencia.getUTCFullYear() &&
          fecha.getUTCMonth() === referencia.getUTCMonth()
        );
      case PeriodoFiltro.ANIO:
        return fecha.getUTCFullYear() === referencia.getUTCFullYear();
      default:
        return true;
    }
  });
}

/** Texto corto para mostrar debajo del filtro (ej. "Semana del 3 al 9 de agosto de 2026"). */
export function describirPeriodo(periodo: PeriodoFiltro, fechaReferencia: string): string {
  if (periodo === PeriodoFiltro.TODAS || !fechaReferencia) return "Todo el historial";

  const referencia = new Date(fechaReferencia);
  if (isNaN(referencia.getTime())) return "Todo el historial";

  const opcionesUTC = { timeZone: "UTC" } as const;

  if (periodo === PeriodoFiltro.DIA) {
    return referencia.toLocaleDateString("es-AR", { dateStyle: "long", ...opcionesUTC });
  }

  if (periodo === PeriodoFiltro.SEMANA) {
    const inicio = inicioDeSemanaUTC(referencia);
    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 6);
    const inicioStr = inicio.toLocaleDateString("es-AR", { day: "numeric", month: "short", ...opcionesUTC });
    const finStr = fin.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", ...opcionesUTC });
    return `Semana del ${inicioStr} al ${finStr}`;
  }

  if (periodo === PeriodoFiltro.MES) {
    const texto = referencia.toLocaleDateString("es-AR", { month: "long", year: "numeric", ...opcionesUTC });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  return `Año ${referencia.getUTCFullYear()}`;
}
