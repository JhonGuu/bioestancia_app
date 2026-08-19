/**
 * Rango de fechas simple para filtros de pantalla — ambos extremos son
 * strings "YYYY-MM-DD" (calendario, sin hora) e INCLUSIVOS, mismo formato
 * que da/toma un `<input type="date">`. Pensado para filtrar client-side
 * datos ya traídos del backend (mismo espíritu que
 * `modules/boletas/domain/filtro-periodo.ts`, pero con un rango libre en vez
 * de un período fijo con fecha de referencia).
 */
export interface RangoFechas {
  desde: string;
  hasta: string;
}

/** Mismo criterio de comparación UTC que `filtro-periodo.ts` — ver comentario ahí sobre por qué UTC y no local. */
function aMedianocheUtc(fechaISO: string): Date {
  return new Date(`${fechaISO}T00:00:00Z`);
}

/** `fechaISO` (string datetime, ej. lo que manda el backend) cae dentro de `rango`, ambos extremos inclusive — comparado por día calendario UTC. */
export function dentroDeRango(fechaISO: string, rango: RangoFechas): boolean {
  const fecha = aMedianocheUtc(fechaISO.slice(0, 10));
  return fecha >= aMedianocheUtc(rango.desde) && fecha <= aMedianocheUtc(rango.hasta);
}
