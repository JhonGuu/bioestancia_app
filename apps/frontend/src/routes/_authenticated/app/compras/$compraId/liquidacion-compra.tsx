import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles, Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useCompra } from "@/modules/compras/hooks/use-compra";
import { useLiquidacionCompra } from "@/modules/liquidacion-compra/hooks/use-liquidacion-compra";
import { useCreateLiquidacionCompra } from "@/modules/liquidacion-compra/hooks/use-create-liquidacion-compra";
import { LiquidacionCompraForm } from "@/modules/liquidacion-compra/components/liquidacion-compra-form";
import { LiquidacionCompraView } from "@/modules/liquidacion-compra/components/liquidacion-compra-view";
import type { CreateLiquidacionCompraFormValues } from "@/modules/liquidacion-compra/domain/liquidacion-compra.schemas";
import { ApiError } from "@/shared/api/api-response";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/$compraId/liquidacion-compra")({
  component: LiquidacionCompraPage,
});

/**
 * Carga o muestra la liquidación de compra (comprobante fiscal al
 * proveedor) de una compra. Se factura sobre `kgVivoFaena` de cada
 * categoría — si alguna todavía no lo tiene (resultado de faena no
 * cargado), se bloquea el formulario con un link a esa pantalla en vez de
 * dejar que el submit falle en el server (mismo criterio de UX que el gate
 * de "compra cerrada" en `editar.tsx`).
 */
function LiquidacionCompraPage() {
  const { compraId } = Route.useParams();
  const { empresaActiva } = useAuth();
  const compraQuery = useCompra(compraId);
  const liquidacionQuery = useLiquidacionCompra(compraId);
  const createLiquidacionCompra = useCreateLiquidacionCompra(compraId);

  const puedeEditar =
    empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;
  const tieneAcceso = useTienePermiso(Permisos.VER_LIQUIDACIONES);

  async function handleSubmit(values: CreateLiquidacionCompraFormValues) {
    try {
      await createLiquidacionCompra.mutateAsync(values);
      toast.success("Liquidación de compra cargada correctamente");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo cargar la liquidación de compra";
      toast.error(message);
    }
  }

  if (!tieneAcceso) {
    return <SinPermiso />;
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
  const faltaResultadoDeFaena = compra.categorias.some((c) => c.kgVivoFaena === null);

  return (
    <div className="max-w-6xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras/$compraId" params={{ compraId }}>
          <ArrowLeft />
          Volver a la compra
        </Link>
      </Button>

      <h1 className="text-2xl font-semibold">
        Liquidación de compra — Tropa {compra.numero}
        {compra.letra ? ` (${compra.letra})` : ""}
      </h1>

      {liquidacionQuery.isPending && (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Buscando liquidación de compra...
        </div>
      )}

      {liquidacionQuery.isError && !noExisteTodavia && (
        <p className="text-destructive py-8 text-center text-sm">{liquidacionQuery.error.message}</p>
      )}

      {liquidacionQuery.isSuccess && (
        <LiquidacionCompraView liquidacion={liquidacionQuery.data} compraId={compraId} puedeEditar={puedeEditar} />
      )}

      {noExisteTodavia && faltaResultadoDeFaena && (
        <p className="text-muted-foreground text-sm">
          Todavía falta cargar el{" "}
          <Link to="/app/compras/$compraId/resultado-faena" params={{ compraId }} className="underline">
            resultado de faena
          </Link>{" "}
          de esta tropa — la liquidación se factura sobre el kg vivo verificado en planta.
        </p>
      )}

      {noExisteTodavia && !faltaResultadoDeFaena && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cargar liquidación de compra</CardTitle>
          </CardHeader>
          <CardContent>
            <LiquidacionCompraForm
              compra={compra}
              onSubmit={handleSubmit}
              isSubmitting={createLiquidacionCompra.isPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
