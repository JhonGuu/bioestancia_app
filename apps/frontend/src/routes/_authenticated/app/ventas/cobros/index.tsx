import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileBarChart, Loader2, Plus } from "lucide-react";

import { useCobros } from "@/modules/cobros/hooks/use-cobros";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { CobrosList } from "@/modules/cobros/components/cobros-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/ventas/cobros/")({
  component: CobrosPage,
});

function CobrosPage() {
  const cobrosQuery = useCobros();
  const clientesQuery = useClientes();

  const cargando = cobrosQuery.isPending || clientesQuery.isPending;
  const error = cobrosQuery.error ?? clientesQuery.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/app/ventas">
              <ArrowLeft className="size-4" />
              Ventas
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Cobros</h1>
          <p className="text-muted-foreground text-sm">
            Pagos cargados de clientes — se aplican a boletas pendientes automáticamente (más antigua primero).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/ventas/cobros/informe">
              <FileBarChart className="size-4" />
              <span className="hidden sm:inline">Informe de cobranzas</span>
              <span className="sm:hidden">Informe</span>
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/ventas/cobros/nuevo">
              <Plus className="size-4" />
              Nuevo cobro
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {cargando ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando cobros...
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          ) : (
            <CobrosList cobros={cobrosQuery.data ?? []} clientes={clientesQuery.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
