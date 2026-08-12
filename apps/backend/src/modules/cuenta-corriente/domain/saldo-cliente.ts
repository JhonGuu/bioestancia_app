/**
 * Resumen del saldo de cuenta corriente de un cliente — resultado de
 * agregación pura (no es una tabla propia, se calcula al vuelo a partir de
 * `boletas`, `ventas`, y las `AplicacionCobro` de `modules/cobros`).
 *
 * `saldoVencido`/`saldoPorVencer`: suma de lo pendiente de cada boleta según
 * si su `fechaVencimiento` ya pasó o no (boletas sin `fechaVencimiento`
 * cargada — legado — cuentan como vencidas, ver `ObtenerSaldoCliente`).
 *
 * `saldoAFavor`: plata cobrada que todavía no se aplicó a ninguna boleta
 * (cobros "a cuenta", o vueltos que sobraron del FIFO) — ver punto 6 de las
 * anotaciones originales de Ventas. NO se descuenta de `saldoTotal`: son dos
 * números independientes, la UI decide cómo mostrarlos juntos.
 */
export interface SaldoCliente {
  clienteId: string;
  saldoVencido: number;
  saldoPorVencer: number;
  saldoTotal: number;
  saldoAFavor: number;
}
