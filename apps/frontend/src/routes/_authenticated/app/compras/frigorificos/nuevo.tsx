import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { useCreateFrigorifico } from "@/modules/frigorificos/hooks/use-create-frigorifico";
import { FrigorificoForm } from "@/modules/frigorificos/components/frigorifico-form";
import type { CreateFrigorificoFormValues } from "@/modules/frigorificos/domain/frigorifico.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/frigorificos/nuevo")({
  component: NuevoFrigorificoPage,
});

function NuevoFrigorificoPage() {
  const navigate = useNavigate();
  const createFrigorifico = useCreateFrigorifico();

  async function handleSubmit(values: CreateFrigorificoFormValues) {
    try {
      await createFrigorifico.mutateAsync(values);
      toast.success("Frigorífico creado correctamente");
      await navigate({ to: "/app/compras/frigorificos" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo crear el frigorífico";
      toast.error(message);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/frigorificos">
          <ArrowLeft />
          Frigoríficos
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">Nuevo frigorífico</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del frigorífico</CardTitle>
        </CardHeader>
        <CardContent>
          <FrigorificoForm onSubmit={handleSubmit} isSubmitting={createFrigorifico.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
