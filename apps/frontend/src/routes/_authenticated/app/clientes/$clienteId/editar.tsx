import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCliente } from "@/modules/clientes/hooks/use-cliente";
import { useUpdateCliente } from "@/modules/clientes/hooks/use-update-cliente";
import { ClienteForm } from "@/modules/clientes/components/cliente-form";
import type { CreateClienteFormValues } from "@/modules/clientes/domain/cliente.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/clientes/$clienteId/editar")({
  component: EditarClientePage,
});

function EditarClientePage() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();
  const clienteQuery = useCliente(clienteId);
  const updateCliente = useUpdateCliente(clienteId);

  async function handleSubmit(values: CreateClienteFormValues) {
    try {
      await updateCliente.mutateAsync(values);
      toast.success("Cliente actualizado correctamente");
      await navigate({ to: "/app/clientes" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo editar el cliente";
      toast.error(message);
    }
  }

  if (clienteQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando cliente...
      </div>
    );
  }

  if (clienteQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{clienteQuery.error.message}</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/clientes">
          <ArrowLeft />
          Volver a clientes
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">Editar cliente</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClienteForm
            cliente={clienteQuery.data}
            onSubmit={handleSubmit}
            isSubmitting={updateCliente.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
