import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Plus } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { ComprasTable } from "@/modules/compras/components/compras-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/")({
  component: ComprasPage,
});

function ComprasPage() {
  const { empresaActiva } = useAuth();
  const comprasQuery = useCompras();
  const proveedoresQuery = useProveedores();

  const puedeEditar =
    empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

  const cargando = comprasQuery.isPending || proveedoresQuery.isPending;
  const error = comprasQuery.error ?? proveedoresQuery.error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Compras</h1>
          <p className="text-muted-foreground text-sm">
            Tropas compradas a proveedores de la empresa activa.
          </p>
        </div>
        <Button asChild>
          <Link to="/app/compras/nuevo">
            <Plus />
            Nueva compra
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent>
          {cargando ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando compras...
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          ) : (
            <ComprasTable
              compras={comprasQuery.data ?? []}
              proveedores={proveedoresQuery.data ?? []}
              puedeEditar={puedeEditar}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
