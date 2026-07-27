import { PlanificacionCabezas } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas";

export interface PlanificacionCabezasRepository {
  /**
   * Lista los planes de una empresa en un rango de fechas (inclusive), de un
   * cliente puntual si se pasa `clienteId`, o de todos los clientes si no
   * (la vista típica es "toda la semana, todos los clientes").
   */
  listByRango(input: ListPlanificacionCabezasFilter): Promise<PlanificacionCabezas[]>;

  /**
   * Guarda varios días de un mismo cliente de una sola vez. Cada día es un
   * upsert por `(clienteId, fecha)`: si ya existía un plan para ese cliente
   * y esa fecha, lo actualiza; si no, lo crea.
   */
  upsertMany(input: UpsertPlanificacionCabezasInput[]): Promise<PlanificacionCabezas[]>;
}

export interface ListPlanificacionCabezasFilter {
  empresaId: string;
  desde: Date;
  hasta: Date;
  clienteId?: string;
}

export interface UpsertPlanificacionCabezasInput {
  empresaId: string;
  clienteId: string;
  fecha: Date;
  cabezasPlanificadas: number;
  comentarios?: string;
}
