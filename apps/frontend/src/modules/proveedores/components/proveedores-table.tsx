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
import { EliminarProveedorDialog } from "@/modules/proveedores/components/eliminar-proveedor-dialog";
import { ReactivarProveedorButton } from "@/modules/proveedores/components/reactivar-proveedor-button";
import { CONDICION_FISCAL_LABELS } from "@/modules/clientes/domain/cliente.types";
import {
  documentoProveedor,
  nombreProveedor,
  type Proveedor,
} from "@/modules/proveedores/domain/proveedor.types";

interface ProveedoresTableProps {
  proveedores: Proveedor[];
  /** Admin/contable: muestra editar/inactivar/reactivar en cada fila. */
  puedeEditar?: boolean;
}

export function ProveedoresTable({ proveedores, puedeEditar }: ProveedoresTableProps) {
  if (proveedores.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay proveedores cargados para esta empresa.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre / Razón social</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>RENSPA</TableHead>
          <TableHead>Condición fiscal</TableHead>
          <TableHead>% desbaste</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Estado</TableHead>
          {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {proveedores.map((proveedor) => (
          <TableRow key={proveedor.id}>
            <TableCell className="font-medium">{nombreProveedor(proveedor)}</TableCell>
            <TableCell>{documentoProveedor(proveedor)}</TableCell>
            <TableCell>{proveedor.renspa ?? "—"}</TableCell>
            <TableCell>{CONDICION_FISCAL_LABELS[proveedor.condicionFiscal]}</TableCell>
            <TableCell>
              {proveedor.porcentajeDesbaste !== null ? `${proveedor.porcentajeDesbaste}%` : "—"}
            </TableCell>
            <TableCell>{proveedor.email ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={proveedor.activo ? "default" : "secondary"}>
                {proveedor.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            {puedeEditar && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild title="Editar proveedor">
                    <Link to="/app/proveedores/$proveedorId/editar" params={{ proveedorId: proveedor.id }}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  {proveedor.activo ? (
                    <EliminarProveedorDialog
                      proveedorId={proveedor.id}
                      nombre={nombreProveedor(proveedor)}
                    />
                  ) : (
                    <ReactivarProveedorButton proveedorId={proveedor.id} />
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
