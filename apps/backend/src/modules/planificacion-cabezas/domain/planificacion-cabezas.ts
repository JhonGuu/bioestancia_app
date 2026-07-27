/**
 * Planificación de cabezas por cliente y por día.
 *
 * Cada fila es el plan de UN cliente para UN día puntual (no un total
 * semanal): la planilla real se carga día por día (lunes, martes, ...), así
 * que un plan de "toda la semana" para un cliente es, en la práctica, varias
 * filas con fechas consecutivas.
 *
 * Es INDEPENDIENTE de `compras`: no reserva cabezas de ninguna tropa puntual.
 * Es al revés — la planificación de lo que los clientes van a comprar es lo
 * que informa cuántos animales conviene comprar en las próximas tropas, no
 * al revés. Por eso no tiene `compraId`.
 *
 * `cabezasPlanificadas` es la meta/pronóstico. Lo efectivamente vendido se
 * cruza en tiempo de lectura contra `ventas` (ver
 * `use-cases/list-planificacion-cabezas.use-case.ts`), no se guarda acá — así
 * nunca puede quedar desactualizado.
 *
 * `UNIQUE(clienteId, fecha)`: un cliente tiene a lo sumo un plan por día. La
 * carga es un upsert (ver `use-cases/upsert-planificacion-cabezas.use-case.ts`):
 * volver a cargar el mismo cliente+día actualiza el plan existente en vez de
 * duplicarlo, porque el plan de la semana se revisa seguido.
 */
export interface PlanificacionCabezas {
  id: string;
  empresaId: string;
  clienteId: string;
  fecha: Date;
  cabezasPlanificadas: number;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
