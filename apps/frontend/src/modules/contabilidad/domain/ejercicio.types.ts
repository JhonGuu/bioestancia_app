/** Espejo de `apps/backend/src/modules/contabilidad/domain/ejercicio.ts`. */
export const EstadoEjercicio = { ABIERTO: "abierto", CERRADO: "cerrado" } as const;
export type EstadoEjercicio = (typeof EstadoEjercicio)[keyof typeof EstadoEjercicio];

export const EstadoPeriodo = { ABIERTO: "abierto", CERRADO: "cerrado" } as const;
export type EstadoPeriodo = (typeof EstadoPeriodo)[keyof typeof EstadoPeriodo];

export interface Ejercicio {
  id: string;
  empresaId: string;
  /** Correlativo por empresa (1, 2, 3...). */
  numero: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoEjercicio;
  createdAt: string;
  updatedAt: string;
}

export interface Periodo {
  id: string;
  ejercicioId: string;
  anio: number;
  /** 1..12 */
  mes: number;
  estado: EstadoPeriodo;
  cerradoAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EjercicioConPeriodos extends Ejercicio {
  periodos: Periodo[];
}

export const MES_LABELS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;
