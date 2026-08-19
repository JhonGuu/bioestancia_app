import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useFrigorifico } from "@/modules/frigorificos/hooks/use-frigorifico";
import { useUpdateFrigorifico } from "@/modules/frigorificos/hooks/use-update-frigorifico";
import { FrigorificoForm } from "@/modules/frigorificos/components/frigorifico-form";
import type { CreateFrigorificoFormValues } from "@/modules/frigorificos/domain/frigorifico.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/frigorificos/$frigorificoId/editar")({
  component: EditarFrigorificoPage,
});

function EditarFrigorificoPage() {
  const { frigorificoId } = Route.useParams();
  const navigate = useNavigate();
  const frigorificoQuery = useFrigorifico(frigorificoId);
  const updateFrigorifico = useUpdateFrigorifico(frigorificoId);

  async function handleSubmit(values: CreateFrigorificoFormValues) {
    try {
      await updateFrigorifico.mutateAsync(values);
      toast.success("Frigorífico actualizado correctamente");
      await navigate({ to: "/app/compras/frigorificos" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo editar el frigorífico";
      toast.error(message);
    }
  }

  if (frigorificoQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando frigorífico...
      </div>
    );
  }

  if (frigorificoQuery.isError) {
    return <p className="text-destructive py-8 text-center text-sm">{frigorificoQuery.error.message}</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/frigorificos">
          <ArrowLeft />
          Frigoríficos
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">Editar frigorífico</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del frigorífico</CardTitle>
        </CardHeader>
        <CardContent>
          <FrigorificoForm
            frigorifico={frigorificoQuery.data}
            onSubmit={handleSubmit}
            isSubmitting={updateFrigorifico.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
