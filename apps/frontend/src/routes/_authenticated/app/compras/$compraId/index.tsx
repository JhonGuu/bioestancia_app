import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useCompra } from "@/modules/compras/hooks/use-compra";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import { CompraCategoriasTable } from "@/modules/compras/components/compra-categorias-table";
import { CerrarCompraDialog } from "@/modules/compras/components/cerrar-compra-dialog";
import { ReabrirCompraDialog } from "@/modules/compras/components/reabrir-compra-dialog";
import { ESPECIE_ANIMAL_LABELS } from "@/modules/compras/domain/compra.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/compras/$compraId/")({
  component: CompraDetallePage,
});

function CompraDetallePage() {
  const { compraId } = Route.useParams();
  const { empresaActiva } = useAuth();
  const compraQuery = useCompra(compraId);
  const proveedoresQuery = useProveedores();

  const puedeEditar =
    empresaActiva?.rol === Roles.ADMIN || empresaActiva?.rol === Roles.CONTABLE;

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
  const proveedor = (proveedoresQuery.data ?? []).find((p) => p.id === compra.proveedorId);

  return (
    <div className="max-w-4xl space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/compras">
          <ArrowLeft />
          Volver a compras
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Compra {compra.numero}
            {compra.letra ? ` (${compra.letra})` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            {proveedor ? nombreProveedor(proveedor) : "Proveedor no encontrado"} ·{" "}
            {new Date(compra.fecha).toLocaleDateString("es-AR")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={compra.cerrada ? "default" : "secondary"}>
            {compra.cerrada ? "Cerrada" : "Abierta"}
          </Badge>
          {puedeEditar && !compra.cerrada && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/compras/$compraId/editar" params={{ compraId: compra.id }}>
                <Pencil />
                Editar
              </Link>
            </Button>
          )}
          {puedeEditar && !compra.cerrada && <CerrarCompraDialog compraId={compra.id} />}
          {puedeEditar && compra.cerrada && <ReabrirCompraDialog compraId={compra.id} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 text-sm">
          <DatoCompra label="Especie" valor={ESPECIE_ANIMAL_LABELS[compra.especie]} />
          <DatoCompra label="DTE" valor={compra.dte} />
          <DatoCompra label="Remito" valor={compra.remito} />
          <DatoCompra label="% desbaste" valor={`${compra.porcentajeDesbaste}%`} />
          <DatoCompra label="Peso bruto (báscula)" valor={`${compra.pesoBruto} kg`} />
          <DatoCompra label="Peso neto" valor={`${compra.pesoNeto} kg`} />
          <DatoCompra
            label="Peso final de venta"
            valor={compra.pesoFinalVenta !== null ? `${compra.pesoFinalVenta} kg` : "—"}
          />
          <DatoCompra label="Rinde" valor={compra.rinde !== null ? `${compra.rinde}%` : "—"} />
          {compra.comentarios && (
            <div className="col-span-3">
              <DatoCompra label="Comentarios" valor={compra.comentarios} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorías / razas</CardTitle>
        </CardHeader>
        <CardContent>
          <CompraCategoriasTable categorias={compra.categorias} />
        </CardContent>
      </Card>
    </div>
  );
}

function DatoCompra({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{valor}</p>
    </div>
  );
}
