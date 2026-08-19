/**
 * Cuánto lleva comprado un cliente en la semana ISO actual (lunes a domingo,
 * ver `shared/domain/semana-iso.ts`) contra su meta configurada
 * (`Cliente.metaCabezasSemanales`) — pensado para la alerta/barra de
 * progreso de "Metas semanales" (ver `use-cases/obtener-progreso-metas-semanales.use-case.ts`).
 *
 * NO dispara ningún descuento por sí solo: la aplicación del precio con
 * descuento, si el cliente llega a la meta, es una acción manual de
 * administración/contable con la herramienta "fijar precio en lote" que ya
 * existe (`PATCH /ventas/precio-lote`) — este objeto es solo informativo.
 */
export interface ProgresoMetaSemanal {
  clienteId: string;
  anio: number;
  semana: number;
  /** Lunes 00:00 UTC de la semana. */
  fechaDesde: Date;
  /** Domingo 23:59:59.999 UTC de la semana (inclusive). */
  fechaHasta: Date;
  metaCabezasSemanales: number;
  /**
   * Cabezas (garrones distintos, mismo criterio que
   * `modules/planificacion-cabezas`) que el cliente compró en esta semana
   * puntual — nunca se arrastra ni se compensa contra otras semanas.
   */
  cabezasCompradas: number;
  cumplida: boolean;
}
