import { BandaCobranza } from "@/modules/porcentaje-cobranza/domain/banda-cobranza";

/**
 * Una semana ISO (lunes a domingo, ver `shared/domain/semana-iso.ts`) del
 * `% de cobranza de deuda vencida` de UN cliente — reverse-engineered de
 * "VENTAS 2026.xlsm" (hoja "Porcentaje de cobranza"). El `% Cobr.` NO
 * cuenta la venta nueva de esa semana contra sí misma: se mide cuánto de la
 * deuda que YA existía al empezar la semana se cobró en esa semana.
 */
export interface SemanaCobranza {
  anio: number;
  semana: number;
  /** Lunes 00:00 UTC de la semana. */
  fechaDesde: Date;
  /** Domingo 23:59:59.999 UTC de la semana (inclusive). */
  fechaHasta: Date;
  /** Boletas facturadas del cliente con fecha en esta semana. */
  vendido: number;
  /** Cobros recibidos esta semana, menos los cargos (recargo/comisión) aplicados esta semana. */
  cobrado: number;
  /** Saldo pendiente al EMPEZAR la semana — antes de sumar `vendido`. Denominador del `% Cobr.`. */
  saldoInicio: number;
  /** `cobrado / saldoInicio` — `null` si `saldoInicio <= 0` (no hay deuda que medir). */
  porcentaje: number | null;
  banda: BandaCobranza | null;
  /** `saldoInicio - cobrado` — lo que quedó sin cobrar de la deuda vieja, sin contar la venta nueva. */
  remanente: number;
}

export interface PorcentajeCobranzaCliente {
  clienteId: string;
  semanas: SemanaCobranza[];
}
