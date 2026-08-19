import { Link } from "@tanstack/react-router";

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
import { CerrarCompraDialog } from "@/modules/compras/components/cerrar-compra-dialog";
import { ReabrirCompraDialog } from "@/modules/compras/components/reabrir-compra-dialog";
import { ESPECIE_ANIMAL_LABELS, type Compra } from "@/modules/compras/domain/compra.types";
import { nombreProveedor, type Proveedor } from "@/modules/proveedores/domain/proveedor.types";

interface ComprasTableProps {
  compras: Compra[];
  proveedores: Proveedor[];
  /** Admin/contable: muestra la acción de cerrar/reabrir directo en cada fila. */
  puedeEditar?: boolean;
}

/**
 * El listado (`GET /compras`) no trae ni las categorías ni el proveedor
 * cruzado — por eso acá se arma un mapa `proveedorId → nombre` en memoria en
 * vez de pedirle a cada fila su detalle (evita un N+1 de requests). Las
 * cabezas compradas (para el diálogo de cierre) se piden recién al abrir el
 * diálogo de esa fila puntual, no para todas las filas de una.
 */
export function ComprasTable({ compras, proveedores, puedeEditar }: ComprasTableProps) {
  if (compras.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay compras cargadas para esta empresa.
      </p>
    );
  }

  const nombrePorProveedorId = new Map(proveedores.map((p) => [p.id, nombreProveedor(p)]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Especie</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Rinde</TableHead>
          {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {compras.map((compra) => (
          <TableRow key={compra.id}>
            <TableCell className="font-medium">
              <Link
                to="/app/compras/$compraId"
                params={{ compraId: compra.id }}
                className="hover:underline"
              >
                {compra.numero}
                {compra.letra ? ` (${compra.letra})` : ""}
              </Link>
            </TableCell>
            <TableCell>{nombrePorProveedorId.get(compra.proveedorId) ?? "—"}</TableCell>
            <TableCell>{new Date(compra.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}</TableCell>
            <TableCell>{ESPECIE_ANIMAL_LABELS[compra.especie]}</TableCell>
            <TableCell>
              <Badge variant={compra.cerrada ? "default" : "secondary"}>
                {compra.cerrada ? "Cerrada" : "Abierta"}
              </Badge>
            </TableCell>
            <TableCell>{compra.rinde !== null ? `${compra.rinde}%` : "—"}</TableCell>
            {puedeEditar && (
              <TableCell className="text-right">
                {compra.cerrada ? (
                  <ReabrirCompraDialog
                    compraId={compra.id}
                    trigger={
                      <Button variant="outline" size="sm">
                        Reabrir
                      </Button>
                    }
                  />
                ) : (
                  <CerrarCompraDialog
                    compraId={compra.id}
                    trigger={
                      <Button variant="outline" size="sm">
                        Cerrar
                      </Button>
                    }
                  />
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
