import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEmpleado } from "@/modules/empleados/hooks/use-empleado";
import { useJornadasEmpleado } from "@/modules/jornadas/hooks/use-jornadas-empleado";
import { JornadasTable } from "@/modules/jornadas/components/jornadas-table";
import { AgregarFichajeManualDialog } from "@/modules/jornadas/components/agregar-fichaje-manual-dialog";
import { hoyISO } from "@/shared/lib/date";

export const Route = createFileRoute("/_authenticated/app/personal/empleados/$empleadoId/asistencia")({
  component: AsistenciaEmpleadoPage,
});

function primerDiaMesISO(): string {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function AsistenciaEmpleadoPage() {
  const { empleadoId } = Route.useParams();
  const empleadoQuery = useEmpleado(empleadoId);
  const [desde, setDesde] = useState(primerDiaMesISO());
  const [hasta, setHasta] = useState(hoyISO());
  const jornadasQuery = useJornadasEmpleado(empleadoId, desde, hasta);

  if (empleadoQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando empleado...
      </div>
    );
  }

  if (empleadoQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{empleadoQuery.error.message}</p>;
  }

  const empleado = empleadoQuery.data;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal/empleados">
          <ArrowLeft />
          Empleados
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          Asistencia — {empleado.apellido}, {empleado.nombre}
        </h1>
        <AgregarFichajeManualDialog empleadoId={empleadoId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rango de fechas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label className="text-muted-foreground text-xs">Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-muted-foreground text-xs">Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setHasta(hoyISO())}>
              Hasta hoy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 sm:px-6">
          {jornadasQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Calculando jornadas...
            </div>
          ) : jornadasQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{jornadasQuery.error.message}</p>
          ) : (
            <JornadasTable jornadas={jornadasQuery.data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
