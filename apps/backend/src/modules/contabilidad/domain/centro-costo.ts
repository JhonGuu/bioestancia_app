/**
 * Centro de costo: dimensión opcional para saber a qué parte del negocio
 * pertenece un movimiento, sin duplicar cuentas.
 *
 * Ejemplo: con una sola cuenta "Combustibles y lubricantes" se puede
 * separar cuánto fue del reparto, cuánto del traslado de hacienda y cuánto
 * de administración. La alternativa (una cuenta por cada combinación)
 * termina inflando el plan de cuentas.
 */
export interface CentroCosto {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
