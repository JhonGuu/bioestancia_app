import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EliminarClienteDialog } from "@/modules/clientes/components/eliminar-cliente-dialog";
import {
  CONDICION_FISCAL_LABELS,
  documentoCliente,
  nombreCliente,
  type Cliente,
} from "@/modules/clientes/domain/cliente.types";

interface ClientesTableProps {
  clientes: Cliente[];
  /** Admin/contable: muestra editar/eliminar en cada fila. */
  puedeEditar?: boolean;
}

export function ClientesTable({ clientes, puedeEditar }: ClientesTableProps) {
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
          {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {clientes.map((cliente) => (
          <TableRow key={cliente.id}>
            <TableCell className="font-medium">
              {nombreCliente(cliente)}
              {cliente.esRevendedor && (
                <Badge variant="outline" className="ml-2 align-middle">
                  Revendedor
                </Badge>
              )}
            </TableCell>
            <TableCell>{documentoCliente(cliente)}</TableCell>
            <TableCell>{CONDICION_FISCAL_LABELS[cliente.condicionFiscal]}</TableCell>
            <TableCell>{cliente.email ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={cliente.activo ? "default" : "secondary"}>
                {cliente.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            {puedeEditar && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild title="Editar cliente">
                    <Link to="/app/clientes/$clienteId/editar" params={{ clienteId: cliente.id }}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <EliminarClienteDialog clienteId={cliente.id} nombre={nombreCliente(cliente)} />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
