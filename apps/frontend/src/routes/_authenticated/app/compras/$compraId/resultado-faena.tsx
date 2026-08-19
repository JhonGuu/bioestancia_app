import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCompra } from "@/modules/compras/hooks/use-compra";
import { useResultadoFaena } from "@/modules/resultado-faena/hooks/use-resultado-faena";
import { useCreateResultadoFaena } from "@/modules/resultado-faena/hooks/use-create-resultado-faena";
import { ResultadoFaenaForm } from "@/modules/resultado-faena/components/resultado-faena-form";
import { ResultadoFaenaView } from "@/modules/resultado-faena/components/resultado-faena-view";
import type { CreateResultadoFaenaFormValues } from "@/modules/resultado-faena/domain/resultado-faena.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/$compraId/resultado-faena")({
  component: ResultadoFaenaPage,
});

/**
 * Carga o muestra el resultado de faena de una compra. `GET` devuelve 404
 * mientras no se cargó — ese caso se trata como estado vacío (mostrar el
 * form), no como error. No hay gate por `compra.cerrada`: el backend no lo
 * exige (la faena, en la práctica, suele pasar antes del cierre de la
 * tropa).
 */
function ResultadoFaenaPage() {
  const { compraId } = Route.useParams();
  const compraQuery = useCompra(compraId);
  const resultadoQuery = useResultadoFaena(compraId);
  const createResultadoFaena = useCreateResultadoFaena(compraId);

  async function handleSubmit(values: CreateResultadoFaenaFormValues) {
    try {
      await createResultadoFaena.mutateAsync(values);
      toast.success("Resultado de faena cargado correctamente");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo cargar el resultado de faena";
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
  const noExisteTodavia =
    resultadoQuery.isError && resultadoQuery.error instanceof ApiError && resultadoQuery.error.status === 404;

  return (
    <div className="max-w-6xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/$compraId" params={{ compraId }}>
          <ArrowLeft />
          Volver a la compra
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">
        Resultado de faena — Tropa {compra.numero}
        {compra.letra ? ` (${compra.letra})` : ""}
      </h1>

      {resultadoQuery.isPending && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Buscando resultado de faena...
        </div>
      )}

      {resultadoQuery.isError && !noExisteTodavia && (
        <p className="text-destructive py-8 text-center text-sm">{resultadoQuery.error.message}</p>
      )}

      {resultadoQuery.isSuccess && <ResultadoFaenaView resultado={resultadoQuery.data} />}

      {noExisteTodavia && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cargar resultado de faena</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultadoFaenaForm
              compra={compra}
              onSubmit={handleSubmit}
              isSubmitting={createResultadoFaena.isPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
