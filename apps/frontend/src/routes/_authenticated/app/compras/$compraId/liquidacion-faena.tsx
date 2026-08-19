import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCompra } from "@/modules/compras/hooks/use-compra";
import { useLiquidacionFaena } from "@/modules/liquidacion-faena/hooks/use-liquidacion-faena";
import { useCreateLiquidacionFaena } from "@/modules/liquidacion-faena/hooks/use-create-liquidacion-faena";
import { LiquidacionFaenaForm } from "@/modules/liquidacion-faena/components/liquidacion-faena-form";
import { LiquidacionFaenaView } from "@/modules/liquidacion-faena/components/liquidacion-faena-view";
import type { CreateLiquidacionFaenaFormValues } from "@/modules/liquidacion-faena/domain/liquidacion-faena.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/$compraId/liquidacion-faena")({
  component: LiquidacionFaenaPage,
});

/**
 * Carga o muestra la liquidación de faena de una compra — lo que el
 * FRIGORÍFICO cobra por faenar, distinto de "Liquidación de compra" (lo que
 * le facturan al proveedor). Mismo patrón que
 * `$compraId/resultado-faena.tsx`: `GET` 404 mientras no se cargó, se trata
 * como estado vacío (mostrar el form).
 */
function LiquidacionFaenaPage() {
  const { compraId } = Route.useParams();
  const compraQuery = useCompra(compraId);
  const liquidacionQuery = useLiquidacionFaena(compraId);
  const createLiquidacionFaena = useCreateLiquidacionFaena(compraId);

  async function handleSubmit(values: CreateLiquidacionFaenaFormValues) {
    try {
      await createLiquidacionFaena.mutateAsync(values);
      toast.success("Liquidación de faena cargada correctamente");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo cargar la liquidación de faena";
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
    liquidacionQuery.isError &&
    liquidacionQuery.error instanceof ApiError &&
    liquidacionQuery.error.status === 404;

  return (
    <div className="max-w-6xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/$compraId" params={{ compraId }}>
          <ArrowLeft />
          Volver a la compra
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">
        Liquidación de faena — Tropa {compra.numero}
        {compra.letra ? ` (${compra.letra})` : ""}
      </h1>

      {liquidacionQuery.isPending && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Buscando liquidación de faena...
        </div>
      )}

      {liquidacionQuery.isError && !noExisteTodavia && (
        <p className="text-destructive py-8 text-center text-sm">{liquidacionQuery.error.message}</p>
      )}

      {liquidacionQuery.isSuccess && <LiquidacionFaenaView liquidacion={liquidacionQuery.data} />}

      {noExisteTodavia && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cargar liquidación de faena</CardTitle>
          </CardHeader>
          <CardContent>
            <LiquidacionFaenaForm
              compra={compra}
              onSubmit={handleSubmit}
              isSubmitting={createLiquidacionFaena.isPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
