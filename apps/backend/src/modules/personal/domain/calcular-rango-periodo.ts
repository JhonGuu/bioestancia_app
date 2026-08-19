import { PeriodoBalance } from "@/modules/personal/domain/balance-horas";

export interface RangoPeriodo {
  /** "YYYY-MM-DD", inclusive. */
  desde: string;
  /** "YYYY-MM-DD", inclusive. */
  hasta: string;
}

function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Medianoche UTC del mismo día calendario que `d` (descarta la hora). */
function soloFechaUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Calcula el rango `[desde, hasta]` (ambos inclusive) del período elegido que
 * contiene a `fechaReferencia`, en UTC — mismo criterio de fechas que el
 * resto del módulo (ver `calcular-jornada.ts`).
 *
 * - Semanal: lunes a domingo de la semana que contiene la fecha.
 * - Quincenal: 1-15 o 16-fin de mes, según en qué mitad cae la fecha.
 * - Mensual: 1 al último día del mes calendario.
 */
export function calcularRangoPeriodo(periodo: PeriodoBalance, fechaReferencia: Date): RangoPeriodo {
  const ref = soloFechaUTC(fechaReferencia);

  if (periodo === PeriodoBalance.SEMANAL) {
    const diaSemana = ref.getUTCDay(); // 0=domingo..6=sábado
    const offsetHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunes = new Date(ref);
    lunes.setUTCDate(lunes.getUTCDate() - offsetHastaLunes);
    const domingo = new Date(lunes);
    domingo.setUTCDate(domingo.getUTCDate() + 6);
    return { desde: fechaISO(lunes), hasta: fechaISO(domingo) };
  }

  if (periodo === PeriodoBalance.QUINCENAL) {
    if (ref.getUTCDate() <= 15) {
      const desde = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
      const hasta = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 15));
      return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
    }
    const desde = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 16));
    const hasta = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));
    return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
  }

  // mensual
  const desde = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
  const hasta = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0));
  return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
}
