import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useCargos } from "@/modules/cargos/hooks/use-cargos";
import { CargosTable } from "@/modules/cargos/components/cargos-table";
import type { EstadoCargoFiltro } from "@/modules/cargos/api/cargos.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/personal/cargos/")({
  component: CargosPage,
});

const ESTADO_LABELS: Record<EstadoCargoFiltro, string> = {
  activos: "Activos",
  inactivos: "Inactivos",
  todos: "Todos",
};

function CargosPage() {
  const { empresaActiva } = useAuth();
  const [estado, setEstado] = useState<EstadoCargoFiltro>("activos");
  const cargosQuery = useCargos(estado);
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
          <h1 className="text-2xl font-semibold">Cargos</h1>
          <p className="text-muted-foreground text-sm">
            Catálogo de cargos y su tolerancia de tardanza para el cálculo de asistencia.
          </p>
        </div>
        {puedeEditar && (
          <Button asChild>
            <Link to="/app/personal/cargos/nuevo">
              <Plus />
              Nuevo cargo
            </Link>
          </Button>
        )}
      </div>

      {puedeEditar && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Estado</span>
          <Select value={estado} onValueChange={(value) => setEstado(value as EstadoCargoFiltro)}>
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
          {cargosQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando cargos...
            </div>
          ) : cargosQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{cargosQuery.error.message}</p>
          ) : (
            <CargosTable cargos={cargosQuery.data} puedeEditar={puedeEditar} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
