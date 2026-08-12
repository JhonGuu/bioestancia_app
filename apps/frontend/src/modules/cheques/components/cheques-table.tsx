import { Link } from "@tanstack/react-router";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ESTADO_CHEQUE_BADGE_VARIANT, ESTADO_CHEQUE_LABELS } from "@/modules/cheques/domain/cheque.types";
import type { Cheque } from "@/modules/cheques/domain/cheque.types";
import type { Cliente } from "@/modules/clientes/domain/cliente.types";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";

interface ChequesTableProps {
  cheques: Cheque[];
  clientes: Cliente[];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** Cartera de cheques — más próximos a vencer primero. Cada fila lleva al detalle para gestionar estado/recargo/comisión. */
export function ChequesTable({ cheques, clientes }: ChequesTableProps) {
  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

  const ordenados = [...cheques].sort(
    (a, b) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime(),
  );

  if (ordenados.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">No hay cheques cargados.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Número</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead>Fecha de pago</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Monto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordenados.map((cheque) => {
          const cliente = clientesPorId.get(cheque.clienteId);
          return (
            <TableRow key={cheque.id} className="hover:bg-accent/50">
              <TableCell className="font-medium">
                <Link
                  to="/app/ventas/cheques/$chequeId"
                  params={{ chequeId: cheque.id }}
                  className="hover:underline"
                >
                  {cliente ? nombreCliente(cliente) : "—"}
                </Link>
              </TableCell>
              <TableCell>{cheque.numero}</TableCell>
              <TableCell>{cheque.banco}</TableCell>
              <TableCell>{new Date(cheque.fechaPago).toLocaleDateString("es-AR", { timeZone: "UTC" })}</TableCell>
              <TableCell>
                <Badge variant={ESTADO_CHEQUE_BADGE_VARIANT[cheque.estado]}>
                  {ESTADO_CHEQUE_LABELS[cheque.estado]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">{formatoMoneda.format(cheque.monto)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
