import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { ClientesCuentaCorrienteList } from "@/modules/cuenta-corriente/components/clientes-cuenta-corriente-list";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/ventas/cuenta-corriente/")({
  component: CuentaCorrientePage,
});

function CuentaCorrientePage() {
  const clientesQuery = useClientes();

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/ventas">
            <ArrowLeft className="size-4" />
            Ventas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Cuenta corriente</h1>
        <p className="text-muted-foreground text-sm">
          Elegí un cliente para ver su resumen de cuenta: saldo total, saldo vencido y el detalle de
          boletas, cobros y cargos.
        </p>
      </div>

      <Card>
        <CardContent>
          {clientesQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando clientes...
            </div>
          ) : clientesQuery.error ? (
            <p className="text-destructive py-8 text-center text-sm">{clientesQuery.error.message}</p>
          ) : (
            <ClientesCuentaCorrienteList clientes={clientesQuery.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
