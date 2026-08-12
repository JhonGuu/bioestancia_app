import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MEDIO_PAGO_LABELS } from "@/modules/cobros/domain/cobro.types";
import { montoTotalCobro, type CobroConLineas } from "@/modules/cobros/domain/cobro.types";
import type { Cliente } from "@/modules/clientes/domain/cliente.types";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";

interface CobrosListProps {
  cobros: CobroConLineas[];
  clientes: Cliente[];
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** Cobros de la empresa activa, más reciente primero. */
export function CobrosList({ cobros, clientes }: CobrosListProps) {
  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

  const ordenados = [...cobros]
    .filter((c) => c.activo)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  if (ordenados.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Todavía no se cargó ningún cobro.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Medios de pago</TableHead>
          <TableHead>Comentarios</TableHead>
          <TableHead className="text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordenados.map((cobro) => {
          const cliente = clientesPorId.get(cobro.clienteId);
          const mediosUnicos = [...new Set(cobro.lineas.map((l) => l.medioPago))];
          return (
            <TableRow key={cobro.id}>
              <TableCell>{new Date(cobro.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}</TableCell>
              <TableCell className="font-medium">{cliente ? nombreCliente(cliente) : "—"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {mediosUnicos.map((medio) => (
                    <Badge key={medio} variant="outline">
                      {MEDIO_PAGO_LABELS[medio]}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">{cobro.comentarios ?? "—"}</TableCell>
              <TableCell className="text-right font-medium">
                {formatoMoneda.format(montoTotalCobro(cobro))}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
