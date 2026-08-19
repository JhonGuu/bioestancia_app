import { Boleta } from "@/modules/boletas/domain/boleta";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { TipoCargo, TIPO_CARGO_LABELS } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { MEDIO_PAGO_LABELS, esMedioPagoCheque, esMedioPagoTransferencia } from "@/modules/cobros/domain/medio-pago";
import { DetalleLineaCobro } from "@/modules/cobros/domain/detalle-linea-cobro";
import { MovimientoCuentaCorriente, TipoMovimientoCuentaCorriente } from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente";
import { formatearMoneda } from "@/shared/infra/documents/formato.util";
import { PDF_COLORS } from "@/shared/infra/documents/pdf-theme.util";

const formatoKg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

/** "Porcina Capón" → "Capón" — mismo criterio que `categoriaCorta` en el frontend (`movimientos-cuenta-corriente-list.tsx`). */
function categoriaCorta(categoria: string): string {
  return categoria.replace(/^Porcina\s+/, "");
}

/** "8" cabezas enteras, o "7.5" si hay alguna media res de por medio. */
function formatoCabezas(cabezas: number): string {
  return cabezas % 1 === 0 ? String(cabezas) : cabezas.toFixed(1);
}

/**
 * Arma las líneas de texto del "Detalle" de un movimiento para el resumen de
 * cuenta en PDF/Excel — mismo criterio que `Detalle()` en el frontend
 * (`movimientos-cuenta-corriente-list.tsx`): boleta con desglose por
 * categoría, cargo con su motivo (si lo tiene), cobro con una línea por
 * medio de pago. Devuelve un array (una entrada por renglón) para que cada
 * generador decida cómo unirlas (`\n` en PDF/Excel).
 */
export function construirLineasDetalleMovimiento(
  movimiento: MovimientoCuentaCorriente,
  boletasPorId: Map<string, Boleta>,
  cargosPorId: Map<string, CargoCuentaCorriente>,
): string[] {
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.BOLETA && movimiento.boletaId) {
    const boleta = boletasPorId.get(movimiento.boletaId);
    const lineas = [`Boleta ${boleta?.numero ?? "s/n"}`];
    for (const d of movimiento.detalleCategorias ?? []) {
      lineas.push(
        `${categoriaCorta(d.categoria)}: ${formatoCabezas(d.cabezas)} / ${formatoKg.format(d.kg)} kg — ${formatearMoneda(d.monto)}`,
      );
    }
    return lineas;
  }

  if (movimiento.tipo === TipoMovimientoCuentaCorriente.CARGO && movimiento.cargoId) {
    const cargo = cargosPorId.get(movimiento.cargoId);
    return [cargo?.motivo ?? (cargo ? TIPO_CARGO_LABELS[cargo.tipo] : "Cargo")];
  }

  if (movimiento.tipo === TipoMovimientoCuentaCorriente.COBRO) {
    if (!movimiento.detalleLineas || movimiento.detalleLineas.length === 0) return ["Cobro"];
    return movimiento.detalleLineas.map((linea) => `${textoDetalleLineaCobro(linea)} (${formatearMoneda(linea.monto)})`);
  }

  return ["Cobro"];
}

/**
 * Texto de una línea de cobro con su medio de pago (y cheque/banco/remitente
 * si corresponde), SIN el monto — usado tanto acá (que le agrega el monto al
 * final) como en el informe de cobranzas (`informe-cobranzas-pdf.generator.ts`),
 * que muestra el monto en su propia columna.
 */
export function textoDetalleLineaCobro(
  linea: Pick<DetalleLineaCobro, "medioPago" | "numeroCheque" | "bancoOBilletera" | "remitente">,
): string {
  let texto = MEDIO_PAGO_LABELS[linea.medioPago] ?? linea.medioPago;
  if (esMedioPagoCheque(linea.medioPago) && linea.numeroCheque) {
    texto += ` — Cheque Nº: ${linea.numeroCheque}`;
  }
  if (esMedioPagoTransferencia(linea.medioPago)) {
    if (linea.bancoOBilletera) texto += ` — ${linea.bancoOBilletera}`;
    if (linea.remitente) texto += ` — Transferencia de: ${linea.remitente}`;
  }
  return texto;
}

export interface ColorMovimiento {
  /** Barra de acento a la izquierda de la fila — `null` para una boleta normal (sin nada que resaltar). */
  accentColor: string | null;
  /** Fondo suave a tono con `accentColor` — `null` junto con `accentColor`. */
  background: string | null;
}

const SIN_COLOR: ColorMovimiento = { accentColor: null, background: null };

/**
 * Color semántico de un movimiento para el PDF — mismo criterio que
 * `esAjusteOCargo`/`esCobro` en el frontend (`movimientos-cuenta-corriente-list.tsx`),
 * pero separando cargo/rechazo en dos colores distintos (ver comentario en
 * `pdf-theme.util.ts`): cobro = verde, recargo/comisión genérico = ámbar,
 * específicamente cheque rechazado (la línea informativa y su comisión) =
 * rojo, boleta con monto negativo (compensación de kg que domina la boleta) = gris azulado.
 */
export function colorParaMovimiento(
  movimiento: MovimientoCuentaCorriente,
  cargosPorId: Map<string, CargoCuentaCorriente>,
): ColorMovimiento {
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.COBRO) {
    return { accentColor: PDF_COLORS.cobro, background: PDF_COLORS.cobroBg };
  }
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.BOLETA) {
    return movimiento.monto < 0
      ? { accentColor: PDF_COLORS.compensacion, background: PDF_COLORS.compensacionBg }
      : SIN_COLOR;
  }
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.CARGO && movimiento.cargoId) {
    const cargo = cargosPorId.get(movimiento.cargoId);
    if (cargo?.tipo === TipoCargo.COMISION_RECHAZO || cargo?.tipo === TipoCargo.CHEQUE_RECHAZADO) {
      return { accentColor: PDF_COLORS.rechazo, background: PDF_COLORS.rechazoBg };
    }
    return { accentColor: PDF_COLORS.cargo, background: PDF_COLORS.cargoBg };
  }
  return SIN_COLOR;
}
