/**
 * Liquidación de compra: el comprobante fiscal (AFIP/ARCA, "Liquidación
 * Compra Directa") que El Meridiano le emite al criadero una vez que se
 * conoce el resultado de faena. Es 1 a 1 con `Compra` (`compraId` único).
 *
 * Se arma sobre el `kgVivoFaena` de cada `CompraCategoria` (el kg vivo
 * verificado en planta, no el `pesoBruto` de báscula al comprar) — por eso
 * requiere que esa compra ya tenga un `ResultadoFaena` cargado.
 *
 * `importeBruto`/`ivaSobreBruto`/`importeNeto` del header se calculan en el
 * server como suma de las líneas de categoría (`importeBruto`/`importeIva`
 * de cada una) más gastos/tributos adicionales — nunca se reciben del
 * cliente HTTP.
 *
 * Hoy esto se carga a mano con los datos que ya salen del comprobante que se
 * emite en AFIP. `numeroComprobante`/`cae`/`fechaVencimientoCae` quedan
 * como referencia — el día que haya integración directa con la API de
 * ARCA, esos campos se completan solos en vez de a mano.
 */
export interface LiquidacionCompra {
  id: string;
  compraId: string;
  numeroComprobante: string;
  fecha: Date;
  fechaOperacion: Date | null;
  cae: string | null;
  fechaVencimientoCae: Date | null;
  importeBruto: number;
  ivaSobreBruto: number;
  totalGastos: number | null;
  ivaSobreGastos: number | null;
  totalTributos: number | null;
  importeNeto: number;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
