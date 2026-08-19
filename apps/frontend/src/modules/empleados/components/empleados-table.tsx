import { Link } from "@tanstack/react-router";
import { CalendarClock, Pencil } from "lucide-react";

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
import { useCargos } from "@/modules/cargos/hooks/use-cargos";
import { EliminarEmpleadoDialog } from "@/modules/empleados/components/eliminar-empleado-dialog";
import { ReactivarEmpleadoButton } from "@/modules/empleados/components/reactivar-empleado-button";
import type { Empleado } from "@/modules/empleados/domain/empleado.types";

interface EmpleadosTableProps {
  empleados: Empleado[];
  /** Admin/contable: muestra editar/inactivar/reactivar en cada fila. */
  puedeEditar?: boolean;
}

export function EmpleadosTable({ empleados, puedeEditar }: EmpleadosTableProps) {
  const cargosQuery = useCargos("todos");
  const cargoPorId = new Map((cargosQuery.data ?? []).map((c) => [c.id, c.nombre]));

  if (empleados.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay empleados cargados para esta empresa.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>DNI</TableHead>
          <TableHead>Cargo</TableHead>
          <TableHead>Fecha de ingreso</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {empleados.map((empleado) => (
          <TableRow key={empleado.id}>
            <TableCell className="font-medium">
              {empleado.apellido}, {empleado.nombre}
            </TableCell>
            <TableCell>{empleado.dni}</TableCell>
            <TableCell>{empleado.cargoId ? (cargoPorId.get(empleado.cargoId) ?? "—") : "—"}</TableCell>
            <TableCell>
              {new Date(empleado.fechaIngreso).toLocaleDateString("es-AR", { timeZone: "UTC" })}
            </TableCell>
            <TableCell>
              <Badge variant={empleado.activo ? "default" : "secondary"}>
                {empleado.activo ? "Activo" : "Inactivo"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" asChild title="Ver asistencia">
                  <Link to="/app/personal/empleados/$empleadoId/asistencia" params={{ empleadoId: empleado.id }}>
                    <CalendarClock className="size-4" />
                  </Link>
                </Button>
                {puedeEditar && (
                  <Button variant="ghost" size="icon" asChild title="Editar empleado">
                    <Link to="/app/personal/empleados/$empleadoId/editar" params={{ empleadoId: empleado.id }}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                )}
                {puedeEditar &&
                  (empleado.activo ? (
                    <EliminarEmpleadoDialog
                      empleadoId={empleado.id}
                      nombreCompleto={`${empleado.nombre} ${empleado.apellido}`}
                    />
                  ) : (
                    <ReactivarEmpleadoButton empleadoId={empleado.id} />
                  ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
