/**
 * Fecha de HOY en formato "YYYY-MM-DD", según el calendario LOCAL del
 * navegador (no UTC).
 *
 * OJO: a propósito usa los getters locales (`getFullYear`/`getMonth`/
 * `getDate`), NO `new Date().toISOString().slice(0, 10)` — ese patrón
 * convierte el instante actual a UTC antes de cortar la fecha, y Argentina
 * es UTC-3: en cualquier momento después de las ~21:00 hora local, la fecha
 * UTC ya rodó al día siguiente. Eso hacía que el botón "Hoy" (y el valor por
 * defecto al cargar una boleta/cobro/endoso de cheque) mostrara mañana en
 * vez de hoy durante la noche.
 *
 * Esto es distinto de cómo se GUARDAN/comparan las fechas ya elegidas
 * (`Boleta.fecha`, etc.), que sí viajan y se comparan como medianoche UTC
 * (ver `modules/boletas/domain/filtro-periodo.ts`) — ese criterio sigue
 * intacto: el string "YYYY-MM-DD" que devuelve esta función, al mandarse al
 * backend, se interpreta como medianoche UTC de ESE día calendario, que es
 * el día calendario correcto porque lo calculamos en hora local.
 */
export function hoyISO(): string {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
