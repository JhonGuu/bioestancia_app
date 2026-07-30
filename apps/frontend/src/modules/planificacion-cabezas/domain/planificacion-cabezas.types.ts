/**
 * Espejo de `apps/backend/src/modules/planificacion-cabezas/domain/*` + el
 * shape enriquecido que devuelve `list-planificacion-cabezas.use-case.ts`
 * (cruce con ventas reales).
 */

/**
 * Una fila = un cliente + un día. Si `id` es `null` es una fila "virtual":
 * hubo una entrega real (`cabezasVendidas > 0`) pero nunca se cargó un plan
 * para ese día — el backend la sintetiza igual para que ninguna entrega
 * quede invisible solo por no tener un plan cargado.
 */
export interface PlanificacionCabezasFila {
  id: string | null;
  empresaId: string;
  clienteId: string;
  fecha: string;
  cabezasPlanificadas: number;
  cabezasVendidas: number;
  comentarios: string | null;
  activo: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DiaPlanificado {
  fecha: string;
  cabezasPlanificadas: number;
  comentarios?: string;
}

export interface UpsertPlanificacionCabezasInput {
  clienteId: string;
  dias: DiaPlanificado[];
}

/**
 * Resumen del período anterior (semana/día/mes pasado) por cliente, para la
 * columna de referencia: cuánto se le vendió REALMENTE vs. cuánto se había
 * planificado venderle en ese mismo período — dos números distintos, uno no
 * implica el otro.
 */
export interface ResumenPeriodoAnterior {
  etiqueta: string;
  vendidoReal: Map<string, number>;
  planificado: Map<string, number>;
}

/** Arma un `ResumenPeriodoAnterior` a partir de las filas crudas de un rango. */
export function resumirPeriodoAnterior(
  filas: PlanificacionCabezasFila[],
  etiqueta: string,
): ResumenPeriodoAnterior {
  const vendidoReal = new Map<string, number>();
  const planificado = new Map<string, number>();
  for (const fila of filas) {
    vendidoReal.set(fila.clienteId, (vendidoReal.get(fila.clienteId) ?? 0) + fila.cabezasVendidas);
    planificado.set(
      fila.clienteId,
      (planificado.get(fila.clienteId) ?? 0) + fila.cabezasPlanificadas,
    );
  }
  return { etiqueta, vendidoReal, planificado };
}
