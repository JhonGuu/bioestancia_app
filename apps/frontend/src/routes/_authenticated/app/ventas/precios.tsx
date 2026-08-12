import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useVentas } from "@/modules/ventas/hooks/use-ventas";
import { useBoletas } from "@/modules/boletas/hooks/use-boletas";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { BoletasPendientesPrecio } from "@/modules/ventas/components/ventas-sin-precio-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/ventas/precios")({
  component: PreciosPage,
});

function PreciosPage() {
  const ventasQuery = useVentas();
  const boletasQuery = useBoletas();
  const clientesQuery = useClientes();

  const cargando = ventasQuery.isPending || boletasQuery.isPending || clientesQuery.isPending;
  const error = ventasQuery.error ?? boletasQuery.error ?? clientesQuery.error;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/ventas">
            <ArrowLeft className="size-4" />
            Ventas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Agregar precio a boletas</h1>
        <p className="text-muted-foreground text-sm">
          El operario carga las boletas sin precio desde el reparto — acá se completan, agrupadas por
          categoría dentro de cada boleta.
        </p>
      </div>

      {cargando ? (
        <Card>
          <CardContent>
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando ventas...
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent>
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          </CardContent>
        </Card>
      ) : (
        <BoletasPendientesPrecio
          ventas={ventasQuery.data ?? []}
          clientes={clientesQuery.data ?? []}
          boletas={boletasQuery.data ?? []}
        />
      )}
    </div>
  );
}
