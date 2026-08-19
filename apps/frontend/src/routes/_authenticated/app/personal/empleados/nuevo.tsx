import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useCreateEmpleado } from "@/modules/empleados/hooks/use-create-empleado";
import { EmpleadoForm } from "@/modules/empleados/components/empleado-form";
import type { CreateEmpleadoFormValues } from "@/modules/empleados/domain/empleado.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/personal/empleados/nuevo")({
  component: NuevoEmpleadoPage,
});

function NuevoEmpleadoPage() {
  const navigate = useNavigate();
  const createEmpleado = useCreateEmpleado();

  async function handleSubmit(values: CreateEmpleadoFormValues) {
    try {
      const empleado = await createEmpleado.mutateAsync(values);
      toast.success("Empleado creado correctamente");
      await navigate({ to: "/app/personal/empleados/$empleadoId/editar", params: { empleadoId: empleado.id } });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear el empleado";
      toast.error(message);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal/empleados">
          <ArrowLeft />
          Empleados
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Nuevo empleado</h1>
        <p className="text-muted-foreground text-sm">
          Después de guardar el legajo vas a poder cargar el horario semanal y la copia del DNI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legajo</CardTitle>
        </CardHeader>
        <CardContent>
          <EmpleadoForm onSubmit={handleSubmit} isSubmitting={createEmpleado.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
