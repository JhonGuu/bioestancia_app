import { Ejercicio, EstadoEjercicio, EstadoPeriodo, Periodo } from "@/modules/contabilidad/domain/ejercicio";

/** Interface del repositorio de ejercicios y períodos. Forma parte del DOMINIO. */
export interface EjercicioRepository {
  list(empresaId: string): Promise<Ejercicio[]>;
  getById(id: string, empresaId: string): Promise<Ejercicio | null>;
  /** Ejercicio que contiene esa fecha (para ubicar un asiento sin pedir el ejercicio). */
  getByFecha(empresaId: string, fecha: Date): Promise<Ejercicio | null>;
  /** ¿Hay algún ejercicio de la empresa que se solape con este rango? */
  existeSolapado(empresaId: string, fechaInicio: Date, fechaFin: Date, excluirId?: string): Promise<boolean>;
  create(input: CreateEjercicioInput): Promise<Ejercicio>;
  cambiarEstado(id: string, empresaId: string, estado: EstadoEjercicio): Promise<Ejercicio>;

  listPeriodos(ejercicioId: string): Promise<Periodo[]>;
  getPeriodoById(id: string): Promise<Periodo | null>;
  /** Período mensual que contiene esa fecha, dentro del ejercicio dado. */
  getPeriodoPorFecha(ejercicioId: string, fecha: Date): Promise<Periodo | null>;
  createPeriodos(ejercicioId: string, periodos: { anio: number; mes: number }[]): Promise<Periodo[]>;
  cambiarEstadoPeriodo(id: string, estado: EstadoPeriodo): Promise<Periodo>;
}

export interface CreateEjercicioInput {
  empresaId: string;
  numero: number;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
}
