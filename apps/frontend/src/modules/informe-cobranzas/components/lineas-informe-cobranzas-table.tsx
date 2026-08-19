import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  MEDIO_PAGO_LABELS,
  esMedioPagoCheque,
  esMedioPagoTransferencia,
} from "@/modules/cobros/domain/cobro.types";
import type { LineaInformeCobranza } from "@/modules/informe-cobranzas/domain/informe-cobranzas.types";

interface LineasInformeCobranzasTableProps {
  lineas: LineaInformeCobranza[];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { timeZone: "UTC" });
}

/** Detalle sin el medio de pago (ya tiene su propia columna) — mismo criterio que el PDF/Excel del informe. */
function Detalle({ linea }: { linea: LineaInformeCobranza }) {
  const partes: string[] = [];
  if (esMedioPagoCheque(linea.medioPago) && linea.numeroCheque) {
    partes.push(`Cheque Nº: ${linea.numeroCheque}`);
  }
  if (esMedioPagoTransferencia(linea.medioPago)) {
    if (linea.bancoOBilletera) partes.push(linea.bancoOBilletera);
    if (linea.remitente) partes.push(`De: ${linea.remitente}`);
  }
  if (partes.length === 0) return <span className="text-muted-foreground">—</span>;
  return <span className="text-muted-foreground text-xs">{partes.join(" — ")}</span>;
}

/** Línea de tiempo de todas las líneas de cobro de la empresa (todos los clientes), más viejo primero. */
export function LineasInformeCobranzasTable({ lineas }: LineasInformeCobranzasTableProps) {
  if (lineas.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Sin cobros en el período seleccionado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Medio de pago</TableHead>
          <TableHead>Detalle</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lineas.map((linea, index) => (
          <TableRow key={`${linea.cobroId}-${index}`}>
            <TableCell>{fecha(linea.fecha)}</TableCell>
            <TableCell>{linea.clienteNombre}</TableCell>
            <TableCell>
              <Badge variant="outline">{MEDIO_PAGO_LABELS[linea.medioPago] ?? linea.medioPago}</Badge>
            </TableCell>
            <TableCell>
              <Detalle linea={linea} />
            </TableCell>
            <TableCell className="text-right font-medium">{formatoMoneda.format(linea.monto)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
