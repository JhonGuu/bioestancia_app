import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { ClientesTable } from "@/modules/clientes/components/clientes-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/clientes/")({
  component: ClientesPage,
});

function ClientesPage() {
  const { empresaActiva } = useAuth();
  const clientesQuery = useClientes();
  const puedeEditar = empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            Clientes de la empresa activa.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/clientes/nuevo">
            <Plus />
            Nuevo cliente
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {clientesQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando clientes...
            </div>
          ) : clientesQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">
              {clientesQuery.error.message}
            </p>
          ) : (
            <ClientesTable clientes={clientesQuery.data} puedeEditar={puedeEditar} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
