import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useEjercicios } from "@/modules/contabilidad/hooks/use-ejercicios";
import { useSumasYSaldos } from "@/modules/contabilidad/hooks/use-sumas-y-saldos";
import { SumasYSaldosTree } from "@/modules/contabilidad/components/sumas-y-saldos-tree";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/contabilidad/reportes/sumas-y-saldos")({
  component: SumasYSaldosPage,
});

function SumasYSaldosPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const [ejercicioId, setEjercicioId] = useState("");
  const [hasta, setHasta] = useState("");

  const ejerciciosQuery = useEjercicios();
  const sumasQuery = useSumasYSaldos({ ejercicioId: ejercicioId || undefined, hasta: hasta || undefined });

  if (!tieneAcceso) return <SinPermiso />;

  const balanceado = sumasQuery.data && sumasQuery.data.diferencia === 0;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad">
            <ArrowLeft className="size-4" />
            Contabilidad
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Sumas y saldos</h1>
        <p className="text-muted-foreground text-sm">
          A cualquier fecha de corte, con la jerarquía completa del plan de cuentas.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Ejercicio (opcional)</span>
          <Select value={ejercicioId || "__todos__"} onValueChange={(v) => setEjercicioId(v === "__todos__" ? "" : v)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todos__">Todos los ejercicios</SelectItem>
              {(ejerciciosQuery.data ?? []).map((ejercicio) => (
                <SelectItem key={ejercicio.id} value={ejercicio.id}>
                  {ejercicio.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Fecha de corte</span>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        </div>
      </div>

      <Card>
        <CardContent>
          {sumasQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando sumas y saldos...
            </div>
          ) : sumasQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{sumasQuery.error.message}</p>
          ) : (
            <div className="space-y-3">
              <SumasYSaldosTree arbol={sumasQuery.data.arbol} />
              <div className="flex flex-wrap items-center gap-3 border-t pt-3 text-sm">
                <span>
                  Total debe: <span className="font-medium">{sumasQuery.data.totalDebe.toFixed(2)}</span>
                </span>
                <span>
                  Total haber: <span className="font-medium">{sumasQuery.data.totalHaber.toFixed(2)}</span>
                </span>
                <span className={cn("font-medium", balanceado ? "text-green-600 dark:text-green-500" : "text-destructive")}>
                  {balanceado ? "Balanceado" : `Diferencia: ${sumasQuery.data.diferencia.toFixed(2)}`}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
