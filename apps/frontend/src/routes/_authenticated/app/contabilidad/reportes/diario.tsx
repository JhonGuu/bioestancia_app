import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useLibroDiario } from "@/modules/contabilidad/hooks/use-libro-diario";
import { AsientosTable } from "@/modules/contabilidad/components/asientos-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/app/contabilidad/reportes/diario")({
  component: LibroDiarioPage,
});

function LibroDiarioPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [incluirBorradores, setIncluirBorradores] = useState(false);

  const libroQuery = useLibroDiario({
    ...(desde && { desde }),
    ...(hasta && { hasta }),
    incluirBorradores,
  });

  if (!tieneAcceso) return <SinPermiso />;

  const balanceado = libroQuery.data && libroQuery.data.totales.diferencia === 0;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad">
            <ArrowLeft className="size-4" />
            Contabilidad
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Libro diario</h1>
        <p className="text-muted-foreground text-sm">
          Asientos en orden cronológico. Por default solo los confirmados.
        </p>
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
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={incluirBorradores}
            onChange={(e) => setIncluirBorradores(e.target.checked)}
            className="accent-primary size-4"
          />
          Incluir borradores
        </label>
      </div>

      <Card>
        <CardContent>
          {libroQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando libro diario...
            </div>
          ) : libroQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{libroQuery.error.message}</p>
          ) : (
            <div className="space-y-3">
              <AsientosTable asientos={libroQuery.data.asientos} />
              <div className="flex flex-wrap items-center gap-3 border-t pt-3 text-sm">
                <span>
                  Debe: <span className="font-medium">{libroQuery.data.totales.debe.toFixed(2)}</span>
                </span>
                <span>
                  Haber: <span className="font-medium">{libroQuery.data.totales.haber.toFixed(2)}</span>
                </span>
                <span className={cn("font-medium", balanceado ? "text-green-600 dark:text-green-500" : "text-destructive")}>
                  {balanceado ? "Balanceado" : `Diferencia: ${libroQuery.data.totales.diferencia.toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
