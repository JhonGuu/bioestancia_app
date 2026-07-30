import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useCreateCompra } from "@/modules/compras/hooks/use-create-compra";
import { CompraForm } from "@/modules/compras/components/compra-form";
import type { CreateCompraFormValues } from "@/modules/compras/domain/compra.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/nuevo")({
  component: NuevaCompraPage,
});

function NuevaCompraPage() {
  const navigate = useNavigate();
  const createCompra = useCreateCompra();

  async function handleSubmit(values: CreateCompraFormValues) {
    try {
      const compra = await createCompra.mutateAsync(values);
      toast.success("Compra creada correctamente");
      await navigate({ to: "/app/compras/$compraId", params: { compraId: compra.id } });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear la compra";
      toast.error(message);
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold">Nueva compra</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos de la compra</CardTitle>
        </CardHeader>
        <CardContent>
          <CompraForm onSubmit={handleSubmit} isSubmitting={createCompra.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
