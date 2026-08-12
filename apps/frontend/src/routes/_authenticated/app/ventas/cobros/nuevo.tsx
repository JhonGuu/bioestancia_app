import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { useCreateCobro } from "@/modules/cobros/hooks/use-create-cobro";
import { CobroForm } from "@/modules/cobros/components/cobro-form";
import type { CreateCobroFormValues } from "@/modules/cobros/domain/cobro.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/ventas/cobros/nuevo")({
  component: NuevoCobroPage,
});

function NuevoCobroPage() {
  const navigate = useNavigate();
  const createCobro = useCreateCobro();

  async function handleSubmit(values: CreateCobroFormValues) {
    try {
      await createCobro.mutateAsync(values);
      toast.success("Cobro cargado correctamente");
      await navigate({ to: "/app/ventas/cobros" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo cargar el cobro";
      toast.error(message);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/ventas/cobros">
            <ArrowLeft className="size-4" />
            Cobros
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Nuevo cobro</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cliente, fecha y líneas de pago</CardTitle>
        </CardHeader>
        <CardContent>
          <CobroForm onSubmit={handleSubmit} isSubmitting={createCobro.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
