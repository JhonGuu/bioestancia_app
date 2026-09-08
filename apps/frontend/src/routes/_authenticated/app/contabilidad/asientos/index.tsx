import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus, Upload } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useAsientos } from "@/modules/contabilidad/hooks/use-asientos";
import { AsientosTable } from "@/modules/contabilidad/components/asientos-table";
import { EstadoAsiento, ESTADO_ASIENTO_LABELS } from "@/modules/contabilidad/domain/asiento.types";
import type { ListarAsientosFiltros } from "@/modules/contabilidad/api/asientos.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/contabilidad/asientos/")({
  component: AsientosPage,
});

function AsientosPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const [estado, setEstado] = useState<EstadoAsiento | "todos">("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const filtros: ListarAsientosFiltros = {
    ...(estado !== "todos" && { estado }),
    ...(desde && { desde }),
    ...(hasta && { hasta }),
  };
  const asientosQuery = useAsientos(filtros);

  if (!tieneAcceso) return <SinPermiso />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Asientos</h1>
          <p className="text-muted-foreground text-sm">Libro diario de la empresa activa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/contabilidad/asientos/importar">
              <Upload />
              Importar Excel
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/contabilidad/asientos/nuevo">
              <Plus />
              Nuevo asiento
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Desde</span>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Hasta</span>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Estado</span>
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoAsiento | "todos")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {Object.values(EstadoAsiento).map((value) => (
                <SelectItem key={value} value={value}>
                  {ESTADO_ASIENTO_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent>
          {asientosQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando asientos...
            </div>
          ) : asientosQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{asientosQuery.error.message}</p>
          ) : (
            <AsientosTable asientos={asientosQuery.data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
