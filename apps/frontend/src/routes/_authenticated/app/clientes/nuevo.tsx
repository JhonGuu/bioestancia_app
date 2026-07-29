import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useCreateCliente } from "@/modules/clientes/hooks/use-create-cliente";
import { ClienteForm } from "@/modules/clientes/components/cliente-form";
import type { CreateClienteFormValues } from "@/modules/clientes/domain/cliente.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/clientes/nuevo")({
  component: NuevoClientePage,
});

function NuevoClientePage() {
  const navigate = useNavigate();
  const createCliente = useCreateCliente();

  async function handleSubmit(values: CreateClienteFormValues) {
    try {
      await createCliente.mutateAsync(values);
      toast.success("Cliente creado correctamente");
      await navigate({ to: "/app/clientes" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear el cliente";
      toast.error(message);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo cliente</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteForm onSubmit={handleSubmit} isSubmitting={createCliente.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
