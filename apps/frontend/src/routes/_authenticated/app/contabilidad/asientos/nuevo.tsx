import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useCrearAsiento } from "@/modules/contabilidad/hooks/use-crear-asiento";
import { AsientoForm } from "@/modules/contabilidad/components/asiento-form";
import type { AsientoFormValues } from "@/modules/contabilidad/domain/asiento.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/contabilidad/asientos/nuevo")({
  component: NuevoAsientoPage,
});

function NuevoAsientoPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const navigate = useNavigate();
  const crear = useCrearAsiento();

  if (!tieneAcceso) return <SinPermiso />;

  async function handleSubmit(values: AsientoFormValues, confirmar: boolean) {
    try {
      const asiento = await crear.mutateAsync({ ...values, confirmar });
      toast.success(confirmar ? `Asiento confirmado con el N° ${asiento.numero}` : "Borrador guardado correctamente");
      await navigate({ to: "/app/contabilidad/asientos/$asientoId", params: { asientoId: asiento.id } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo guardar el asiento");
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad/asientos">
            <ArrowLeft className="size-4" />
            Asientos
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nuevo asiento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del asiento</CardTitle>
        </CardHeader>
        <CardContent>
          <AsientoForm onSubmit={handleSubmit} isSubmitting={crear.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
