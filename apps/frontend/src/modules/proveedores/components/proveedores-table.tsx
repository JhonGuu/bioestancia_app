import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CONDICION_FISCAL_LABELS } from "@/modules/clientes/domain/cliente.types";
import {
  documentoProveedor,
  nombreProveedor,
  type Proveedor,
} from "@/modules/proveedores/domain/proveedor.types";

export function ProveedoresTable({ proveedores }: { proveedores: Proveedor[] }) {
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
