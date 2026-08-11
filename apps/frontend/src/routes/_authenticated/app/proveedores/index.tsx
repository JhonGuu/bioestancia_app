import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { ProveedoresTable } from "@/modules/proveedores/components/proveedores-table";
import type { EstadoProveedorFiltro } from "@/modules/proveedores/api/proveedores.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/proveedores/")({
  component: ProveedoresPage,
});

const ESTADO_LABELS: Record<EstadoProveedorFiltro, string> = {
  activos: "Activos",
  inactivos: "Inactivos",
  todos: "Todos",
};

function ProveedoresPage() {
  const { empresaActiva } = useAuth();
  const [estado, setEstado] = useState<EstadoProveedorFiltro>("activos");
  const proveedoresQuery = useProveedores(estado);
  const puedeEditar = empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-muted-foreground text-sm">
            Proveedores (criaderos) de la empresa activa.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/proveedores/nuevo">
            <Plus />
            Nuevo proveedor
          </Link>
        </Button>
      </div>

      {puedeEditar && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Estado</span>
          <Select value={estado} onValueChange={(value) => setEstado(value as EstadoProveedorFiltro)}>
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
          {proveedoresQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando proveedores...
            </div>
          ) : proveedoresQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">
              {proveedoresQuery.error.message}
            </p>
          ) : (
            <ProveedoresTable proveedores={proveedoresQuery.data} puedeEditar={puedeEditar} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
