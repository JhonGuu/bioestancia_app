import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useEjercicios } from "@/modules/contabilidad/hooks/use-ejercicios";
import { CrearEjercicioDialog } from "@/modules/contabilidad/components/crear-ejercicio-dialog";
import { EjercicioCard } from "@/modules/contabilidad/components/ejercicio-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/contabilidad/ejercicios/")({
  component: EjerciciosPage,
});

function EjerciciosPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const puedeAdministrar = useTienePermiso(Permisos.ADMINISTRAR_PLAN_CUENTAS);
  const puedeCerrar = useTienePermiso(Permisos.CERRAR_PERIODOS);
  const ejerciciosQuery = useEjercicios();

  if (!tieneAcceso) return <SinPermiso />;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad">
            <ArrowLeft className="size-4" />
            Contabilidad
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Ejercicios y períodos</h1>
            <p className="text-muted-foreground text-sm">
              Cada empresa define su propio cierre — cerrar un período congela sus asientos.
            </p>
          </div>
          {puedeAdministrar && <CrearEjercicioDialog />}
        </div>
      </div>

      {ejerciciosQuery.isPending ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando ejercicios...
        </div>
      ) : ejerciciosQuery.isError ? (
        <p className="text-destructive py-8 text-center text-sm">{ejerciciosQuery.error.message}</p>
      ) : ejerciciosQuery.data.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Todavía no hay ejercicios cargados para esta empresa.
        </p>
      ) : (
        <div className="space-y-4">
          {ejerciciosQuery.data.map((ejercicio) => (
            <EjercicioCard key={ejercicio.id} ejercicio={ejercicio} puedeCerrar={puedeCerrar} />
          ))}
        </div>
      )}
    </div>
  );
}
