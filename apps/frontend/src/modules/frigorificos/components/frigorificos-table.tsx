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
import { EliminarFrigorificoDialog } from "@/modules/frigorificos/components/eliminar-frigorifico-dialog";
import { ReactivarFrigorificoButton } from "@/modules/frigorificos/components/reactivar-frigorifico-button";
import type { Frigorifico } from "@/modules/frigorificos/domain/frigorifico.types";

interface FrigorificosTableProps {
  frigorificos: Frigorifico[];
  /** Admin/contable: muestra editar/inactivar/reactivar en cada fila. */
  puedeEditar?: boolean;
}

export function FrigorificosTable({ frigorificos, puedeEditar }: FrigorificosTableProps) {
  if (frigorificos.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay frigoríficos cargados para esta empresa.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>CUIT</TableHead>
          <TableHead>SENASA Nº</TableHead>
          <TableHead>Nº establecimiento RUCA</TableHead>
          <TableHead>Estado</TableHead>
          {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {frigorificos.map((frigorifico) => (
          <TableRow key={frigorifico.id}>
            <TableCell className="font-medium">{frigorifico.nombre}</TableCell>
            <TableCell>{frigorifico.cuit ?? "—"}</TableCell>
            <TableCell>{frigorifico.senasaNumero ?? "—"}</TableCell>
            <TableCell>{frigorifico.rucaNumero ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={frigorifico.activo ? "default" : "secondary"}>
                {frigorifico.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            {puedeEditar && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild title="Editar frigorífico">
                    <Link
                      to="/app/compras/frigorificos/$frigorificoId/editar"
                      params={{ frigorificoId: frigorifico.id }}
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  {frigorifico.activo ? (
                    <EliminarFrigorificoDialog
                      frigorificoId={frigorifico.id}
                      nombre={frigorifico.nombre}
                    />
                  ) : (
                    <ReactivarFrigorificoButton frigorificoId={frigorifico.id} />
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
