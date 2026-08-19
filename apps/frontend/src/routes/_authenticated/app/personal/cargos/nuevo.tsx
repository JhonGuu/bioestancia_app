import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useCreateCargo } from "@/modules/cargos/hooks/use-create-cargo";
import { CargoForm } from "@/modules/cargos/components/cargo-form";
import type { CreateCargoFormValues } from "@/modules/cargos/domain/cargo.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/personal/cargos/nuevo")({
  component: NuevoCargoPage,
});

function NuevoCargoPage() {
  const navigate = useNavigate();
  const createCargo = useCreateCargo();

  async function handleSubmit(values: CreateCargoFormValues) {
    try {
      await createCargo.mutateAsync(values);
      toast.success("Cargo creado correctamente");
      await navigate({ to: "/app/personal/cargos" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear el cargo";
      toast.error(message);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal/cargos">
          <ArrowLeft />
          Cargos
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">Nuevo cargo</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <CargoForm onSubmit={handleSubmit} isSubmitting={createCargo.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
