/**
 * Auxiliar (o "submayor") que exige una cuenta de control para poder
 * imputarle un movimiento.
 *
 * Ejemplo: "Deudores por ventas" es una cuenta de control — su saldo es la
 * suma de lo que debe cada cliente, y el mayor se puede abrir por cliente.
 * Sin auxiliar obligatorio, esa apertura no se puede reconstruir después.
 *
 * `NINGUNO` es el default: la mayoría de las cuentas (gastos, ventas,
 * bienes de uso) no necesitan submayor.
 */
export enum TipoAuxiliar {
  NINGUNO = "ninguno",
  CLIENTE = "cliente",
  PROVEEDOR = "proveedor",
  EMPLEADO = "empleado",
  FRIGORIFICO = "frigorifico",
  /** Caja/banco/billetera — la entidad llega en la fase 3 (tesorería). */
  CUENTA_FONDOS = "cuenta_fondos",
  CHEQUE = "cheque",
}
