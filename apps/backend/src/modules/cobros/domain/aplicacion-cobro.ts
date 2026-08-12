/**
 * Registra cuánto de un `Cobro` se aplicó a una `Boleta` puntual —
 * el resultado del algoritmo FIFO (`AplicarCobroFifo`), no algo que cargue
 * un usuario a mano.
 *
 * Un mismo cobro puede tener varias aplicaciones (si alcanza para cancelar
 * más de una boleta pendiente), y una misma boleta puede recibir
 * aplicaciones de varios cobros distintos a lo largo del tiempo (pagos
 * parciales). El saldo pendiente de una boleta es
 * `montoBoleta - SUM(aplicaciones.monto WHERE boletaId = boleta.id)`.
 *
 * Si un cobro sobra plata después de aplicar FIFO a todo lo pendiente (o no
 * hay boletas pendientes), el excedente no se aplica a nada — se refleja
 * como "saldo a favor" en la cuenta corriente (`modules/cuenta-corriente`),
 * no se fuerza una aplicación a boletas futuras.
 */
export interface AplicacionCobro {
  id: string;
  cobroId: string;
  boletaId: string;
  monto: number;
  createdAt: Date;
}
