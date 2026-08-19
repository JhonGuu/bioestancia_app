import { Link } from "@tanstack/react-router";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ESTADO_CHEQUE_BADGE_VARIANT, ESTADO_CHEQUE_LABELS, esListoParaCobrar } from "@/modules/cheques/domain/cheque.types";
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
          const listo = esListoParaCobrar(cheque);
          return (
            <TableRow
              key={cheque.id}
              className={
                listo
                  ? "bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25"
                  : "hover:bg-accent/50"
              }
            >
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
              <TableCell>
                <div className="flex items-center gap-1">
                  {new Date(cheque.fechaPago).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                  {listo && (
                    <Badge
                      variant="outline"
                      className="border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400"
                    >
                      Listo para cobrar
                    </Badge>
                  )}
                </div>
              </TableCell>
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
