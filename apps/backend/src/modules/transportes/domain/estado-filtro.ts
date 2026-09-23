/**
 * "activos" (default): solo lo no eliminado — lo que se usa en selectores.
 * "inactivos": solo lo dado de baja (soft-delete), para encontrarlo y
 * reactivarlo. "todos": sin filtrar. Mismo criterio que `proveedores`.
 */
export type EstadoTransporteFiltro = "activos" | "inactivos" | "todos";
