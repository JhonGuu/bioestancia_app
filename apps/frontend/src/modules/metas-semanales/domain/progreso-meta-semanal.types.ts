/**
 * Espejo de `apps/backend/src/modules/metas-semanales/domain/progreso-meta-semanal.ts`.
 */
export interface ProgresoMetaSemanal {
  clienteId: string;
  anio: number;
  semana: number;
  fechaDesde: string;
  fechaHasta: string;
  metaCabezasSemanales: number;
  cabezasCompradas: number;
  cumplida: boolean;
}
