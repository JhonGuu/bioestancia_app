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
import { EliminarCargoDialog } from "@/modules/cargos/components/eliminar-cargo-dialog";
import { ReactivarCargoButton } from "@/modules/cargos/components/reactivar-cargo-button";
import type { Cargo } from "@/modules/cargos/domain/cargo.types";

interface CargosTableProps {
  cargos: Cargo[];
  /** Admin/contable: muestra editar/inactivar/reactivar en cada fila. */
  puedeEditar?: boolean;
}

export function CargosTable({ cargos, puedeEditar }: CargosTableProps) {
  if (cargos.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay cargos cargados para esta empresa.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tolerancia de tardanza</TableHead>
          <TableHead>Estado</TableHead>
          {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {cargos.map((cargo) => (
          <TableRow key={cargo.id}>
            <TableCell className="font-medium">{cargo.nombre}</TableCell>
            <TableCell>
              {cargo.toleranciaMinutos !== null ? `${cargo.toleranciaMinutos} min` : "—"}
            </TableCell>
            <TableCell>
              <Badge variant={cargo.activo ? "default" : "secondary"}>
                {cargo.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            {puedeEditar && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild title="Editar cargo">
                    <Link
                      to="/app/personal/cargos/$cargoId/editar"
                      params={{ cargoId: cargo.id }}
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  {cargo.activo ? (
                    <EliminarCargoDialog cargoId={cargo.id} nombre={cargo.nombre} />
                  ) : (
                    <ReactivarCargoButton cargoId={cargo.id} />
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
