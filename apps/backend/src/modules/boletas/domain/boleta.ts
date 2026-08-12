/**
 * Representación de la Boleta en el dominio.
 *
 * Una boleta es el comprobante que se le entrega a un cliente por sus
 * compras de un día — agrupa las líneas de `ventas` de ese cliente en esa
 * fecha (`ventas.boletaId`). Se modela como entidad propia (no como un
 * reporte armado on-the-fly a partir de `ventas`) por dos motivos:
 *
 * 1. `numero`: el número de boleta impreso en el papel es un dato que hay
 *    que poder guardar y consultar, no se puede reconstruir después.
 * 2. A futuro, poder adjuntar la foto del papel escaneado — tiene sentido
 *    guardarla una vez por boleta, no repetida en cada línea de venta.
 *
 * `clienteId` + `fecha` identifican "de quién y de qué día" es, pero no son
 * unique compuesto: nada impide (por ahora) cargar dos boletas del mismo
 * cliente el mismo día si hace falta corregir/reemplazar una.
 */
export interface Boleta {
  id: string;
  empresaId: string;
  clienteId: string;
  fecha: Date;
  /**
   * `fecha + diasPlazoPagoEfectivo(cliente)`, calculado UNA vez al crear la
   * boleta (`CreateBoleta`) — no se recalcula si después cambia el plazo del
   * cliente (el plazo pactado es el vigente al momento de la entrega). Se usa
   * para el saldo vencido/a vencer de la cuenta corriente (ver
   * `modules/cuenta-corriente`). Nullable solo por boletas cargadas antes de
   * que existiera este campo.
   */
  fechaVencimiento: Date | null;
  numero: string | null;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** `fecha + diasPlazoPago` días corridos — sin lógica de días hábiles. */
export function calcularFechaVencimiento(fecha: Date, diasPlazoPago: number): Date {
  return new Date(fecha.getTime() + diasPlazoPago * 24 * 60 * 60 * 1000);
}
