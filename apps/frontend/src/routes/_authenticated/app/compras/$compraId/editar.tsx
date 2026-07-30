import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCompra } from "@/modules/compras/hooks/use-compra";
import { useUpdateCompra } from "@/modules/compras/hooks/use-update-compra";
import { EditarCompraForm } from "@/modules/compras/components/editar-compra-form";
import type { UpdateCompraFormValues } from "@/modules/compras/domain/compra.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/$compraId/editar")({
  component: EditarCompraPage,
});

function EditarCompraPage() {
  const { compraId } = Route.useParams();
  const navigate = useNavigate();
  const compraQuery = useCompra(compraId);
  const updateCompra = useUpdateCompra(compraId);

  async function handleSubmit(values: UpdateCompraFormValues) {
    try {
      await updateCompra.mutateAsync(values);
      toast.success("Compra actualizada correctamente");
      await navigate({ to: "/app/compras/$compraId", params: { compraId } });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo editar la compra";
      toast.error(message);
    }
  }

  if (compraQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando compra...
      </div>
    );
  }

  if (compraQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{compraQuery.error.message}</p>;
  }

  const compra = compraQuery.data;

  if (compra.cerrada) {
    return (
      <div className="max-w-4xl space-y-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/app/compras/$compraId" params={{ compraId }}>
            <ArrowLeft />
            Volver a la compra
          </Link>
        </Button>
        <p className="text-muted-foreground text-sm">
          Esta compra está cerrada — no se puede editar. Reabrila primero desde la página de
          detalle.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/$compraId" params={{ compraId }}>
          <ArrowLeft />
          Volver a la compra
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">
        Editar compra {compra.numero}
        {compra.letra ? ` (${compra.letra})` : ""}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent>
          <EditarCompraForm
            compra={compra}
            onSubmit={handleSubmit}
            isSubmitting={updateCompra.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
