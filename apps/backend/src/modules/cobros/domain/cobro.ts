/**
 * Representación del Cobro en el dominio.
 *
 * Un cobro es un pago que hace un cliente — NO necesariamente la
 * cancelación de una boleta puntual (ver anotaciones del punto 6): el
 * cliente puede pagar "a cuenta" sin indicar qué boleta cancela. Por eso
 * `Cobro` no referencia ninguna boleta directamente — la distribución del
 * monto entre boletas pendientes la calcula `AplicarCobroFifo` (algoritmo
 * FIFO por fecha de boleta) y queda registrada en `AplicacionCobro`.
 *
 * El monto total del cobro es la suma de sus `LineaCobro` (no se duplica acá
 * como campo — se calcula siempre a partir de las líneas).
 *
 * `activo`: pensado para una futura funcionalidad de "anular cobro" (no
 * implementada todavía — no hay endpoint que la dispare) — se agrega la
 * columna ahora, siguiendo el mismo patrón de soft-delete que el resto de
 * las entidades "cabecera" (clientes, proveedores, boletas), para no tener
 * que migrar el schema cuando se construya.
 */
export interface Cobro {
  id: string;
  empresaId: string;
  clienteId: string;
  fecha: Date;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
