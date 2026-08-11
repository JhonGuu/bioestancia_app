import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useProveedor } from "@/modules/proveedores/hooks/use-proveedor";
import { useUpdateProveedor } from "@/modules/proveedores/hooks/use-update-proveedor";
import { ProveedorForm } from "@/modules/proveedores/components/proveedor-form";
import type { CreateProveedorFormValues } from "@/modules/proveedores/domain/proveedor.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/proveedores/$proveedorId/editar")({
  component: EditarProveedorPage,
});

function EditarProveedorPage() {
  const { proveedorId } = Route.useParams();
  const navigate = useNavigate();
  const proveedorQuery = useProveedor(proveedorId);
  const updateProveedor = useUpdateProveedor(proveedorId);

  async function handleSubmit(values: CreateProveedorFormValues) {
    try {
      await updateProveedor.mutateAsync(values);
      toast.success("Proveedor actualizado correctamente");
      await navigate({ to: "/app/proveedores" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo editar el proveedor";
      toast.error(message);
    }
  }

  if (proveedorQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando proveedor...
      </div>
    );
  }

  if (proveedorQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{proveedorQuery.error.message}</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/proveedores">
          <ArrowLeft />
          Volver a proveedores
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">Editar proveedor</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <ProveedorForm
            proveedor={proveedorQuery.data}
            onSubmit={handleSubmit}
            isSubmitting={updateProveedor.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
