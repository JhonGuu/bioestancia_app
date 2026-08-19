/**
 * Marcación cruda e inmutable del reloj de fichaje — nunca se recalcula ni
 * se pisa, solo se agrega. Ver `docs/plan-personal-asistencia.md`, punto 5.
 */
export const TipoFichaje = {
  ENTRADA: "entrada",
  SALIDA: "salida",
} as const;
export type TipoFichaje = (typeof TipoFichaje)[keyof typeof TipoFichaje];

export const OrigenFichaje = {
  /** Vino del Excel que exporta el lector de huellas. */
  IMPORTADO: "importado",
  /** Cargado a mano desde la vista de asistencia (ej. un olvido de marcar). */
  MANUAL: "manual",
} as const;
export type OrigenFichaje = (typeof OrigenFichaje)[keyof typeof OrigenFichaje];

export interface Fichaje {
  id: string;
  empresaId: string;
  empleadoId: string;
  /** Fecha y hora exactas de la marcación. */
  momento: Date;
  tipo: TipoFichaje;
  origen: OrigenFichaje;
  createdAt: Date;
}
