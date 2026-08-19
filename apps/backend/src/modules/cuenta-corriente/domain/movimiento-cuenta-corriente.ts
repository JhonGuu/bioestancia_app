import { DetalleCategoriaVenta } from "@/modules/ventas/domain/detalle-categoria-venta";
import { DetalleLineaCobro } from "@/modules/cobros/domain/detalle-linea-cobro";

export enum TipoMovimientoCuentaCorriente {
  BOLETA = "boleta",
  COBRO = "cobro",
  /** Recargo por cheque a más de 7 días o comisión por cheque rechazado — ver `modules/cargos-cuenta-corriente`. */
  CARGO = "cargo",
}

/**
 * Un renglón del resumen de cuenta de un cliente — mezcla boletas (deuda),
 * cobros (pago), y cargos (recargo/comisión, deuda) ordenados por fecha,
 * más viejo primero (formato libro contable), pensado para el "resumen de
 * cuenta" que se le manda al cliente (ver Fase 4, `docs/plan-ventas-cuenta-corriente.md`).
 *
 * Las boletas SIN facturar (con alguna venta pendiente de precio) no
 * generan movimiento todavía — ver `calcularMontoBoleta`.
 */
export interface MovimientoCuentaCorriente {
  tipo: TipoMovimientoCuentaCorriente;
  fecha: Date;
  boletaId: string | null;
  cobroId: string | null;
  cargoId: string | null;
  /** Monto de la boleta/cargo (deuda) o del cobro (pago) — siempre positivo. */
  monto: number;
  /** Solo en movimientos `BOLETA`: lo que queda pendiente de esa boleta puntual. */
  saldoPendiente: number | null;
  /** Solo en movimientos `BOLETA`. */
  fechaVencimiento: Date | null;
  /** Saldo total del cliente inmediatamente después de este movimiento (orden cronológico ascendente). */
  saldoCorriente: number;
  /** Solo en movimientos `BOLETA`: cabezas/kg/monto agrupados por categoría (Capón, MEI, Chancha, etc. — ver `agruparVentasPorCategoria`). */
  detalleCategorias: DetalleCategoriaVenta[] | null;
  /** Solo en movimientos `COBRO`: una entrada por línea, con su medio de pago (y cheque/banco/remitente si corresponde). */
  detalleLineas: DetalleLineaCobro[] | null;
}
