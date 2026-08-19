import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCargo } from "@/modules/cargos/hooks/use-cargo";
import { useUpdateCargo } from "@/modules/cargos/hooks/use-update-cargo";
import { CargoForm } from "@/modules/cargos/components/cargo-form";
import type { CreateCargoFormValues } from "@/modules/cargos/domain/cargo.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/personal/cargos/$cargoId/editar")({
  component: EditarCargoPage,
});

function EditarCargoPage() {
  const { cargoId } = Route.useParams();
  const navigate = useNavigate();
  const cargoQuery = useCargo(cargoId);
  const updateCargo = useUpdateCargo(cargoId);

  async function handleSubmit(values: CreateCargoFormValues) {
    try {
      await updateCargo.mutateAsync(values);
      toast.success("Cargo actualizado correctamente");
      await navigate({ to: "/app/personal/cargos" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo editar el cargo";
      toast.error(message);
    }
  }

  if (cargoQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando cargo...
      </div>
    );
  }

  if (cargoQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{cargoQuery.error.message}</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal/cargos">
          <ArrowLeft />
          Cargos
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">Editar cargo</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <CargoForm cargo={cargoQuery.data} onSubmit={handleSubmit} isSubmitting={updateCargo.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
