import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useStockTropas } from "@/modules/compras/hooks/use-stock-tropas";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { StockTropasTable } from "@/modules/compras/components/stock-tropas-table";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/stock")({
  component: StockTropasPage,
});

function StockTropasPage() {
  const stockQuery = useStockTropas();
  const proveedoresQuery = useProveedores();

  const cargando = stockQuery.isPending || proveedoresQuery.isPending;
  const error = stockQuery.error ?? proveedoresQuery.error;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/app/compras" className="text-muted-foreground text-sm hover:underline">
          ← Volver a compras
        </Link>
        <h1 className="text-2xl font-semibold">Stock de tropas</h1>
        <p className="text-muted-foreground text-sm">
          Stock teórico de cada tropa abierta: cabezas compradas menos cabezas ya vendidas.
        </p>
      </div>

      <Card>
        <CardContent>
          {cargando ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando stock...
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          ) : (
            <StockTropasTable tropas={stockQuery.data ?? []} proveedores={proveedoresQuery.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
