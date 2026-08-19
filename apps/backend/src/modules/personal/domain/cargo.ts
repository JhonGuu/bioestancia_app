/**
 * Representación del Cargo (puesto) en el dominio — catálogo chico, como
 * `Frigorifico`. Se usa para agrupar tolerancia de llegada tarde por puesto
 * en vez de cargarla persona por persona (ver `docs/plan-personal-asistencia.md`,
 * punto 1 y 3), y como referencia del puesto de cada `Empleado`.
 */
export interface Cargo {
  id: string;
  empresaId: string;
  nombre: string;
  /**
   * Minutos de tolerancia para llegadas tarde de este cargo — segundo nivel
   * de la cascada (Empleado > Cargo > Empresa). Null = no define tolerancia
   * propia, se cae al nivel de Empresa.
   */
  toleranciaMinutos: number | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
