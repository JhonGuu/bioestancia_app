import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useFrigorificos } from "@/modules/frigorificos/hooks/use-frigorificos";
import { FrigorificosTable } from "@/modules/frigorificos/components/frigorificos-table";
import type { EstadoFrigorificoFiltro } from "@/modules/frigorificos/api/frigorificos.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/compras/frigorificos/")({
  component: FrigorificosPage,
});

const ESTADO_LABELS: Record<EstadoFrigorificoFiltro, string> = {
  activos: "Activos",
  inactivos: "Inactivos",
  todos: "Todos",
};

function FrigorificosPage() {
  const { empresaActiva } = useAuth();
  const [estado, setEstado] = useState<EstadoFrigorificoFiltro>("activos");
  const frigorificosQuery = useFrigorificos(estado);
  const puedeEditar = empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras">
          <ArrowLeft />
          Compras
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Frigoríficos</h1>
          <p className="text-muted-foreground text-sm">
            Establecimientos faenadores — donde se carga el resultado de faena de cada tropa.
          </p>
        </div>
        {puedeEditar && (
          <Button asChild>
            <Link to="/app/compras/frigorificos/nuevo">
              <Plus />
              Nuevo frigorífico
            </Link>
          </Button>
        )}
      </div>

      {puedeEditar && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Estado</span>
          <Select value={estado} onValueChange={(value) => setEstado(value as EstadoFrigorificoFiltro)}>
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
          {frigorificosQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando frigoríficos...
            </div>
          ) : frigorificosQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">
              {frigorificosQuery.error.message}
            </p>
          ) : (
            <FrigorificosTable frigorificos={frigorificosQuery.data} puedeEditar={puedeEditar} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
