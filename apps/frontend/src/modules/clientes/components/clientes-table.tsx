import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CONDICION_FISCAL_LABELS,
  documentoCliente,
  nombreCliente,
  type Cliente,
} from "@/modules/clientes/domain/cliente.types";

export function ClientesTable({ clientes }: { clientes: Cliente[] }) {
  if (clientes.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay clientes cargados para esta empresa.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre / Razón social</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Condición fiscal</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow key={cliente.id}>
            <TableCell className="font-medium">{nombreCliente(cliente)}</TableCell>
            <TableCell>{documentoCliente(cliente)}</TableCell>
            <TableCell>{CONDICION_FISCAL_LABELS[cliente.condicionFiscal]}</TableCell>
            <TableCell>{cliente.email ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={cliente.activo ? "default" : "secondary"}>
                {cliente.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
