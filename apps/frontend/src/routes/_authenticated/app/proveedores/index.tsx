import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";

import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { ProveedoresTable } from "@/modules/proveedores/components/proveedores-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/proveedores/")({
  component: ProveedoresPage,
});

function ProveedoresPage() {
  const proveedoresQuery = useProveedores();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-muted-foreground text-sm">
            Proveedores (criaderos) de la empresa activa.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/proveedores/nuevo">
            <Plus />
            Nuevo proveedor
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {proveedoresQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando proveedores...
            </div>
          ) : proveedoresQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">
              {proveedoresQuery.error.message}
            </p>
          ) : (
            <ProveedoresTable proveedores={proveedoresQuery.data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
