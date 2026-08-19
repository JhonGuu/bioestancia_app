import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useEmpleado } from "@/modules/empleados/hooks/use-empleado";
import { useUpdateEmpleado } from "@/modules/empleados/hooks/use-update-empleado";
import { EmpleadoForm } from "@/modules/empleados/components/empleado-form";
import { HorarioSemanalForm } from "@/modules/empleados/components/horario-semanal-form";
import { DniUpload } from "@/modules/empleados/components/dni-upload";
import type { CreateEmpleadoFormValues } from "@/modules/empleados/domain/empleado.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/personal/empleados/$empleadoId/editar")({
  component: EditarEmpleadoPage,
});

function EditarEmpleadoPage() {
  const { empleadoId } = Route.useParams();
  const navigate = useNavigate();
  const empleadoQuery = useEmpleado(empleadoId);
  const updateEmpleado = useUpdateEmpleado(empleadoId);

  async function handleSubmit(values: CreateEmpleadoFormValues) {
    try {
      await updateEmpleado.mutateAsync(values);
      toast.success("Empleado actualizado correctamente");
      await navigate({ to: "/app/personal/empleados" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo editar el empleado";
      toast.error(message);
    }
  }

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
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal/empleados">
          <ArrowLeft />
          Empleados
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">
        Editar empleado — {empleado.nombre} {empleado.apellido}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legajo</CardTitle>
        </CardHeader>
        <CardContent>
          <EmpleadoForm empleado={empleado} onSubmit={handleSubmit} isSubmitting={updateEmpleado.isPending} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horario semanal pactado</CardTitle>
        </CardHeader>
        <CardContent>
          <HorarioSemanalForm empleadoId={empleado.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Copia del DNI</CardTitle>
        </CardHeader>
        <CardContent>
          <DniUpload empleadoId={empleado.id} tieneArchivo={!!empleado.dniArchivoPath} />
        </CardContent>
      </Card>
    </div>
  );
}
