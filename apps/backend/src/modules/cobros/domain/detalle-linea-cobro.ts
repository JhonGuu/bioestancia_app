import { Cheque } from "@/modules/cheques/domain/cheque";
import { LineaCobro } from "@/modules/cobros/domain/linea-cobro";
import { MedioPago, esMedioPagoCheque } from "@/modules/cobros/domain/medio-pago";

/**
 * Detalle de una línea de un cobro, pensado para mostrarse en la cuenta
 * corriente ("Detalle" de un movimiento COBRO) — igual espíritu que
 * `DetalleCategoriaVenta` para boletas: no se usa para calcular nada, solo
 * para que se vea el medio de pago (y, si es cheque, su número) sin abrir el
 * cobro.
 */
export interface DetalleLineaCobro {
  medioPago: MedioPago;
  monto: number;
  /** Solo si `medioPago` es CHEQUE/ECHEQ — viene del `Cheque` referenciado, no de la línea. */
  numeroCheque: string | null;
  bancoCheque: string | null;
  /** Solo si `medioPago` es TRANSFERENCIA_BANCO/BILLETERA_VIRTUAL. */
  bancoOBilletera: string | null;
  remitente: string | null;
}

/** Arma el detalle de cada línea de un cobro, resolviendo el cheque de las líneas CHEQUE/ECHEQ contra el mapa dado. */
export function construirDetalleLineas(lineas: LineaCobro[], chequesPorId: Map<string, Cheque>): DetalleLineaCobro[] {
  return lineas.map((linea) => {
    const cheque = linea.chequeId ? (chequesPorId.get(linea.chequeId) ?? null) : null;
    return {
      medioPago: linea.medioPago,
      monto: linea.monto,
      numeroCheque: esMedioPagoCheque(linea.medioPago) ? (cheque?.numero ?? null) : null,
      bancoCheque: esMedioPagoCheque(linea.medioPago) ? (cheque?.banco ?? null) : null,
      bancoOBilletera: linea.bancoOBilletera,
      remitente: linea.remitente,
    };
  });
}
