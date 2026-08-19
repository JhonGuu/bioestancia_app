import { Link } from "@tanstack/react-router";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  TipoMovimientoCuentaCorriente,
  TIPO_MOVIMIENTO_LABELS,
  type MovimientoCuentaCorriente,
} from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente.types";
import { TIPO_CARGO_LABELS, type CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.types";
import { MEDIO_PAGO_LABELS, esMedioPagoCheque, esMedioPagoTransferencia, type MedioPago } from "@/modules/cobros/domain/cobro.types";
import type { Boleta } from "@/modules/boletas/domain/boleta.types";

interface MovimientosCuentaCorrienteListProps {
  movimientos: MovimientoCuentaCorriente[];
  boletas: Boleta[];
  cargos: CargoCuentaCorriente[];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const formatoKg = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

/** "Porcina Capón" → "Capón" — igual criterio que `categoriaCorta` en `boleta-form.tsx`. */
function categoriaCorta(categoria: string): string {
  return categoria.replace(/^Porcina\s+/, "");
}

/** "8" cabezas enteras, o "7.5" si hay alguna media res de por medio. */
function formatoCabezas(cabezas: number): string {
  return cabezas % 1 === 0 ? String(cabezas) : cabezas.toFixed(1);
}

/** Detalle de cada movimiento — boleta con su número + desglose por categoría, cargo con su tipo, cobro genérico. */
function Detalle({
  movimiento,
  boletasPorId,
  cargosPorId,
}: {
  movimiento: MovimientoCuentaCorriente;
  boletasPorId: Map<string, Boleta>;
  cargosPorId: Map<string, CargoCuentaCorriente>;
}) {
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.BOLETA && movimiento.boletaId) {
    const boleta = boletasPorId.get(movimiento.boletaId);
    return (
      <div>
        <Link to="/app/boletas/$boletaId" params={{ boletaId: movimiento.boletaId }} className="hover:underline">
          Boleta {boleta?.numero ?? "s/n"}
        </Link>
        {movimiento.detalleCategorias && movimiento.detalleCategorias.length > 0 && (
          <ul className="text-muted-foreground mt-0.5 space-y-0.5 text-xs">
            {movimiento.detalleCategorias.map((d) => (
              <li key={d.categoria}>
                {categoriaCorta(d.categoria)}: {formatoCabezas(d.cabezas)} / {formatoKg.format(d.kg)} kg —{" "}
                {formatoMoneda.format(d.monto)}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.CARGO && movimiento.cargoId) {
    const cargo = cargosPorId.get(movimiento.cargoId);
    // `motivo` (ej. "Cheque rechazo Nº: 21321321") es más útil que el label genérico del tipo — se prefiere si está.
    return <span>{cargo?.motivo ?? (cargo ? TIPO_CARGO_LABELS[cargo.tipo] : "Cargo")}</span>;
  }
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.COBRO) {
    if (!movimiento.detalleLineas || movimiento.detalleLineas.length === 0) {
      return <span>Cobro</span>;
    }
    return (
      <ul className="space-y-0.5 text-xs">
        {movimiento.detalleLineas.map((linea, i) => (
          <li key={i}>
            <span className="text-foreground font-medium">
              {MEDIO_PAGO_LABELS[linea.medioPago as MedioPago] ?? linea.medioPago}
            </span>
            {esMedioPagoCheque(linea.medioPago as MedioPago) && linea.numeroCheque && (
              <span className="text-muted-foreground"> — Cheque Nº: {linea.numeroCheque}</span>
            )}
            {esMedioPagoTransferencia(linea.medioPago as MedioPago) && (
              <span className="text-muted-foreground">
                {linea.bancoOBilletera ? ` — ${linea.bancoOBilletera}` : ""}
                {linea.remitente ? ` — Transferencia de: ${linea.remitente}` : ""}
              </span>
            )}
            <span className="text-muted-foreground"> ({formatoMoneda.format(linea.monto)})</span>
          </li>
        ))}
      </ul>
    );
  }
  return <span>Cobro</span>;
}

/** Línea de tiempo de boletas, cobros y cargos de un cliente, más reciente primero, con el saldo corriente. */
export function MovimientosCuentaCorrienteList({
  movimientos,
  boletas,
  cargos,
}: MovimientosCuentaCorrienteListProps) {
  const boletasPorId = new Map(boletas.map((b) => [b.id, b]));
  const cargosPorId = new Map(cargos.map((c) => [c.id, c]));

  if (movimientos.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Sin movimientos todavía.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Detalle</TableHead>
          <TableHead className="text-right">Monto</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map((movimiento, index) => {
          const esCobro = movimiento.tipo === TipoMovimientoCuentaCorriente.COBRO;
          // Recargo por cheque / comisión (CARGO) y ajustes de kg en contra del
          // cliente dentro de una boleta (compensación de kg, monto negativo) se
          // resaltan en amarillo — no son ni una venta normal ni un pago.
          const esAjusteOCargo =
            movimiento.tipo === TipoMovimientoCuentaCorriente.CARGO ||
            (movimiento.tipo === TipoMovimientoCuentaCorriente.BOLETA && movimiento.monto < 0);
          const vencida =
            movimiento.tipo === TipoMovimientoCuentaCorriente.BOLETA &&
            movimiento.fechaVencimiento !== null &&
            new Date(movimiento.fechaVencimiento).getTime() < Date.now() &&
            (movimiento.saldoPendiente ?? 0) > 0.01;
          return (
            <TableRow
              key={`${movimiento.tipo}-${movimiento.boletaId ?? movimiento.cobroId ?? movimiento.cargoId}-${index}`}
              className={esAjusteOCargo ? "bg-yellow-50 dark:bg-yellow-500/15" : undefined}
            >
              <TableCell>{fecha(movimiento.fecha)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant="outline">{TIPO_MOVIMIENTO_LABELS[movimiento.tipo]}</Badge>
                  {vencida && <Badge variant="destructive">Vencida</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <Detalle movimiento={movimiento} boletasPorId={boletasPorId} cargosPorId={cargosPorId} />
              </TableCell>
              <TableCell
                className={
                  esCobro
                    ? "text-right text-red-600 dark:text-red-400"
                    : esAjusteOCargo
                      ? "text-right text-yellow-700 dark:text-yellow-400"
                      : "text-right"
                }
              >
                {/* Un cobro siempre resta saldo. Una boleta/cargo normalmente suma, pero una
                    compensación de kg en contra del cliente (monto negativo) también resta —
                    por eso el signo mostrado no es fijo por tipo, sigue el efecto real. */}
                {(esCobro ? -movimiento.monto : movimiento.monto) < 0 ? "-" : "+"}
                {formatoMoneda.format(Math.abs(movimiento.monto))}
              </TableCell>
              <TableCell className="text-right font-medium">{formatoMoneda.format(movimiento.saldoCorriente)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
