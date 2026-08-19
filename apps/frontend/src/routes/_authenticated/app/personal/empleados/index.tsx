import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useEmpleados } from "@/modules/empleados/hooks/use-empleados";
import { EmpleadosTable } from "@/modules/empleados/components/empleados-table";
import type { EstadoEmpleadoFiltro } from "@/modules/empleados/api/empleados.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/personal/empleados/")({
  component: EmpleadosPage,
});

const ESTADO_LABELS: Record<EstadoEmpleadoFiltro, string> = {
  activos: "Activos",
  inactivos: "Inactivos",
  todos: "Todos",
};

function EmpleadosPage() {
  const { empresaActiva } = useAuth();
  const [estado, setEstado] = useState<EstadoEmpleadoFiltro>("activos");
  const empleadosQuery = useEmpleados(estado);
  const puedeEditar = empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal">
          <ArrowLeft />
          Personal
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Empleados</h1>
          <p className="text-muted-foreground text-sm">
            Legajo completo: datos personales, laborales, horario pactado y DNI.
          </p>
        </div>
        {puedeEditar && (
          <Button asChild>
            <Link to="/app/personal/empleados/nuevo">
              <Plus />
              Nuevo empleado
            </Link>
          </Button>
        )}
      </div>

      {puedeEditar && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Estado</span>
          <Select value={estado} onValueChange={(value) => setEstado(value as EstadoEmpleadoFiltro)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardContent>
          {empleadosQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando empleados...
            </div>
          ) : empleadosQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{empleadosQuery.error.message}</p>
          ) : (
            <EmpleadosTable empleados={empleadosQuery.data} puedeEditar={puedeEditar} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
