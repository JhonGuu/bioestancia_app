import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useCreateBoleta } from "@/modules/boletas/hooks/use-create-boleta";
import { BoletaForm } from "@/modules/boletas/components/boleta-form";
import type { CreateBoletaFormValues } from "@/modules/boletas/domain/boleta.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/boletas/nueva")({
  component: NuevaBoletaPage,
});

function NuevaBoletaPage() {
  const navigate = useNavigate();
  const createBoleta = useCreateBoleta();

  async function handleSubmit(values: CreateBoletaFormValues) {
    try {
      const boleta = await createBoleta.mutateAsync(values);
      toast.success("Boleta cargada correctamente");
      await navigate({ to: "/app/boletas/$boletaId", params: { boletaId: boleta.id } });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo cargar la boleta";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Nueva boleta</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente, tropa e ítems entregados</CardTitle>
        </CardHeader>
        <CardContent>
          <BoletaForm onSubmit={handleSubmit} isSubmitting={createBoleta.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
