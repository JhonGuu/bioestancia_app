import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { useCreateProveedor } from "@/modules/proveedores/hooks/use-create-proveedor";
import { ProveedorForm } from "@/modules/proveedores/components/proveedor-form";
import type { CreateProveedorFormValues } from "@/modules/proveedores/domain/proveedor.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/proveedores/nuevo")({
  component: NuevoProveedorPage,
});

function NuevoProveedorPage() {
  const navigate = useNavigate();
  const createProveedor = useCreateProveedor();

  async function handleSubmit(values: CreateProveedorFormValues) {
    try {
      await createProveedor.mutateAsync(values);
      toast.success("Proveedor creado correctamente");
      await navigate({ to: "/app/proveedores" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear el proveedor";
      toast.error(message);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo proveedor</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <ProveedorForm onSubmit={handleSubmit} isSubmitting={createProveedor.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
