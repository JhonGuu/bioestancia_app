import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Banknote, Loader2, Pencil, Receipt, Scale } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useCompra } from "@/modules/compras/hooks/use-compra";
import { useProveedores } from "@/modules/proveedores/hooks/use-proveedores";
import { nombreProveedor } from "@/modules/proveedores/domain/proveedor.types";
import { CompraCategoriasTable } from "@/modules/compras/components/compra-categorias-table";
import { CerrarCompraDialog } from "@/modules/compras/components/cerrar-compra-dialog";
import { ReabrirCompraDialog } from "@/modules/compras/components/reabrir-compra-dialog";
import { ESPECIE_ANIMAL_LABELS } from "@/modules/compras/domain/compra.types";
import { useResultadoFaena } from "@/modules/resultado-faena/hooks/use-resultado-faena";
import { useLiquidacionFaena } from "@/modules/liquidacion-faena/hooks/use-liquidacion-faena";
import { useLiquidacionCompra } from "@/modules/liquidacion-compra/hooks/use-liquidacion-compra";
import { ApiError } from "@/shared/api/api-response";
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
  const resultadoFaenaQuery = useResultadoFaena(compraId);
  const liquidacionFaenaQuery = useLiquidacionFaena(compraId);
  const liquidacionCompraQuery = useLiquidacionCompra(compraId);

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
        <Link to="/app/compras/tropas">
          <ArrowLeft />
          Volver a tropas
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
            {new Date(compra.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
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
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <DatoCompra label="Especie" valor={ESPECIE_ANIMAL_LABELS[compra.especie]} />
          <DatoCompra label="DTE" valor={compra.dte} />
          <DatoCompra label="Remito" valor={compra.remito} />
          <DatoCompra
            label="$/kg en pie"
            valor={compra.precioCompraKg !== null ? `$${compra.precioCompraKg}` : "—"}
          />
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resultado de faena</CardTitle>
        </CardHeader>
        <CardContent>
          {resultadoFaenaQuery.isPending && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Buscando resultado de faena...
            </div>
          )}

          {resultadoFaenaQuery.isSuccess && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-6">
                <DatoCompra label="Kg carne total" valor={`${resultadoFaenaQuery.data.kgCarneTotal} kg`} />
                <DatoCompra label="Rendimiento" valor={`${resultadoFaenaQuery.data.rendimiento}%`} />
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/compras/$compraId/resultado-faena" params={{ compraId: compra.id }}>
                  <Scale />
                  Ver detalle
                </Link>
              </Button>
            </div>
          )}

          {resultadoFaenaQuery.isError &&
            (resultadoFaenaQuery.error instanceof ApiError && resultadoFaenaQuery.error.status === 404 ? (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Todavía no se cargó el resultado de faena.</p>
                {puedeEditar && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/app/compras/$compraId/resultado-faena" params={{ compraId: compra.id }}>
                      <Scale />
                      Cargar resultado de faena
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-destructive text-sm">{resultadoFaenaQuery.error.message}</p>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liquidación de faena</CardTitle>
        </CardHeader>
        <CardContent>
          {liquidacionFaenaQuery.isPending && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Buscando liquidación de faena...
            </div>
          )}

          {liquidacionFaenaQuery.isSuccess && (
            <div className="flex items-center justify-between text-sm">
              <DatoCompra label="Total" valor={`$${liquidacionFaenaQuery.data.total.toLocaleString("es-AR")}`} />
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/compras/$compraId/liquidacion-faena" params={{ compraId: compra.id }}>
                  <Banknote />
                  Ver detalle
                </Link>
              </Button>
            </div>
          )}

          {liquidacionFaenaQuery.isError &&
            (liquidacionFaenaQuery.error instanceof ApiError && liquidacionFaenaQuery.error.status === 404 ? (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Todavía no se cargó la liquidación de faena.</p>
                {puedeEditar && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/app/compras/$compraId/liquidacion-faena" params={{ compraId: compra.id }}>
                      <Banknote />
                      Cargar liquidación de faena
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-destructive text-sm">{liquidacionFaenaQuery.error.message}</p>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liquidación de compra</CardTitle>
        </CardHeader>
        <CardContent>
          {liquidacionCompraQuery.isPending && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Buscando liquidación de compra...
            </div>
          )}

          {liquidacionCompraQuery.isSuccess && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-6">
                <DatoCompra label="Nº comprobante" valor={liquidacionCompraQuery.data.numeroComprobante} />
                <DatoCompra
                  label="Importe neto"
                  valor={`$${liquidacionCompraQuery.data.importeNeto.toLocaleString("es-AR")}`}
                />
                <DatoCompra label="CAE" valor={liquidacionCompraQuery.data.cae ?? "—"} />
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/app/compras/$compraId/liquidacion-compra" params={{ compraId: compra.id }}>
                  <Receipt />
                  Ver detalle
                </Link>
              </Button>
            </div>
          )}

          {liquidacionCompraQuery.isError &&
            (liquidacionCompraQuery.error instanceof ApiError && liquidacionCompraQuery.error.status === 404 ? (
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Todavía no se cargó la liquidación de compra.</p>
                {puedeEditar && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/app/compras/$compraId/liquidacion-compra" params={{ compraId: compra.id }}>
                      <Receipt />
                      Cargar liquidación de compra
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-destructive text-sm">{liquidacionCompraQuery.error.message}</p>
            ))}
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
