import { Link } from "@tanstack/react-router";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  TipoMovimientoCuentaCorriente,
  TIPO_MOVIMIENTO_LABELS,
  type MovimientoCuentaCorriente,
} from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente.types";
import { TIPO_CARGO_LABELS, type CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.types";
import type { Boleta } from "@/modules/boletas/domain/boleta.types";

interface MovimientosCuentaCorrienteListProps {
  movimientos: MovimientoCuentaCorriente[];
  boletas: Boleta[];
  cargos: CargoCuentaCorriente[];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

/** Detalle de cada movimiento — boleta con su número, cargo con su tipo, cobro genérico (no tiene vista propia todavía). */
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
      <Link to="/app/boletas/$boletaId" params={{ boletaId: movimiento.boletaId }} className="hover:underline">
        Boleta {boleta?.numero ?? "s/n"}
      </Link>
    );
  }
  if (movimiento.tipo === TipoMovimientoCuentaCorriente.CARGO && movimiento.cargoId) {
    const cargo = cargosPorId.get(movimiento.cargoId);
    return <span>{cargo ? TIPO_CARGO_LABELS[cargo.tipo] : "Cargo"}</span>;
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
          const vencida =
            movimiento.tipo === TipoMovimientoCuentaCorriente.BOLETA &&
            movimiento.fechaVencimiento !== null &&
            new Date(movimiento.fechaVencimiento).getTime() < Date.now() &&
            (movimiento.saldoPendiente ?? 0) > 0.01;
          return (
            <TableRow key={`${movimiento.tipo}-${movimiento.boletaId ?? movimiento.cobroId ?? movimiento.cargoId}-${index}`}>
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
              <TableCell className={esCobro ? "text-right text-emerald-600" : "text-right"}>
                {esCobro ? "-" : "+"}
                {formatoMoneda.format(movimiento.monto)}
              </TableCell>
              <TableCell className="text-right font-medium">{formatoMoneda.format(movimiento.saldoCorriente)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
