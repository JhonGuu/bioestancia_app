import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useAsiento } from "@/modules/contabilidad/hooks/use-asiento";
import { useActualizarAsiento } from "@/modules/contabilidad/hooks/use-actualizar-asiento";
import { AsientoForm } from "@/modules/contabilidad/components/asiento-form";
import type { AsientoFormValues } from "@/modules/contabilidad/domain/asiento.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/contabilidad/asientos/$asientoId/editar")({
  component: EditarAsientoPage,
});

function EditarAsientoPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const { asientoId } = Route.useParams();
  const navigate = useNavigate();
  const asientoQuery = useAsiento(asientoId);
  const actualizar = useActualizarAsiento();

  if (!tieneAcceso) return <SinPermiso />;

  async function handleSubmit(values: AsientoFormValues) {
    try {
      await actualizar.mutateAsync({ id: asientoId, input: values });
      toast.success("Asiento actualizado correctamente");
      await navigate({ to: "/app/contabilidad/asientos/$asientoId", params: { asientoId } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo actualizar el asiento");
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad/asientos/$asientoId" params={{ asientoId }}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Editar asiento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del asiento</CardTitle>
        </CardHeader>
        <CardContent>
          {asientoQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando asiento...
            </div>
          ) : asientoQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{asientoQuery.error.message}</p>
          ) : (
            <AsientoForm
              asiento={asientoQuery.data}
              onSubmit={(values) => handleSubmit(values)}
              isSubmitting={actualizar.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
