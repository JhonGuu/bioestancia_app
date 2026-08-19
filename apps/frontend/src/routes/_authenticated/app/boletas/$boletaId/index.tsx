import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileDown, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { useBoleta } from "@/modules/boletas/hooks/use-boleta";
import { useDescargarBoletaPdf } from "@/modules/boletas/hooks/use-descargar-boleta-pdf";
import { EditarBoletaDialog } from "@/modules/boletas/components/editar-boleta-dialog";
import { EliminarBoletaDialog } from "@/modules/boletas/components/eliminar-boleta-dialog";
import { EditarVentaItemDialog } from "@/modules/ventas/components/editar-venta-item-dialog";
import { EliminarVentaDialog } from "@/modules/ventas/components/eliminar-venta-dialog";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { FORMA_VENTA_LABELS } from "@/modules/ventas/domain/venta.types";
import type { Venta } from "@/modules/ventas/domain/venta.types";
import { ApiError } from "@/shared/api/api-response";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/boletas/$boletaId/")({
  component: BoletaDetallePage,
});

function BoletaDetallePage() {
  const { boletaId } = Route.useParams();
  const boletaQuery = useBoleta(boletaId);
  const clientesQuery = useClientes();
  const comprasQuery = useCompras();
  const descargarPdf = useDescargarBoletaPdf();
  const [editandoBoleta, setEditandoBoleta] = useState(false);
  const [ventaEditando, setVentaEditando] = useState<Venta | null>(null);

  const handleDescargarPdf = () => {
    descargarPdf.mutate(boletaId, {
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo generar el PDF");
      },
    });
  };

  if (boletaQuery.isPending || clientesQuery.isPending || comprasQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando boleta...
      </div>
    );
  }

  if (boletaQuery.error || !boletaQuery.data) {
    return (
      <p className="text-destructive py-16 text-center text-sm">
        {boletaQuery.error?.message ?? "No se encontró la boleta"}
      </p>
    );
  }

  const boleta = boletaQuery.data;
  const cliente = (clientesQuery.data ?? []).find((c) => c.id === boleta.clienteId);
  const comprasPorId = new Map((comprasQuery.data ?? []).map((c) => [c.id, c]));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link to="/app/boletas" className="text-muted-foreground text-sm hover:underline">
            ← Volver a boletas
          </Link>
          <h1 className="text-2xl font-semibold">Boleta {boleta.numero ? `N° ${boleta.numero}` : ""}</h1>
          <p className="text-muted-foreground text-sm">
            {cliente ? nombreCliente(cliente) : "—"} ·{" "}
            {new Date(boleta.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={handleDescargarPdf} disabled={descargarPdf.isPending}>
            {descargarPdf.isPending ? <Loader2 className="animate-spin" /> : <FileDown />}
            <span className="hidden sm:inline">Descargar PDF</span>
          </Button>
          <Button variant="outline" onClick={() => setEditandoBoleta(true)}>
            <Pencil />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <EliminarBoletaDialog boletaId={boleta.id} />
        </div>
      </div>

      {boleta.comentarios && (
        <Card>
          <CardContent className="text-sm">{boleta.comentarios}</CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {boleta.ventas.map((venta) => {
          const tropa = venta.compraId ? comprasPorId.get(venta.compraId) : null;
          return (
            <Card key={venta.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">
                  {FORMA_VENTA_LABELS[venta.formaVenta]}
                  {venta.categoria ? ` · ${venta.categoria}` : ""}
                </CardTitle>
                <div className="flex items-center gap-1">
                  {venta.precioKg === null ? (
                    <Badge variant="outline">Pendiente de precio</Badge>
                  ) : (
                    <Badge variant="secondary">${venta.total?.toLocaleString("es-AR")}</Badge>
                  )}
                  <Button variant="ghost" size="icon" title="Editar ítem" onClick={() => setVentaEditando(venta)}>
                    <Pencil className="size-4" />
                  </Button>
                  <EliminarVentaDialog ventaId={venta.id} />
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {venta.garron !== null && (
                  <div>
                    <span className="block text-xs">Garrón</span>
                    {venta.garron}
                  </div>
                )}
                <div>
                  <span className="block text-xs">Peso</span>
                  {venta.kg} kg
                </div>
                {tropa && (
                  <div>
                    <span className="block text-xs">Tropa</span>
                    {tropa.letra ? `Letra ${tropa.letra}` : tropa.numero}
                  </div>
                )}
                {venta.precioKg !== null && (
                  <div>
                    <span className="block text-xs">Precio/kg</span>${venta.precioKg}
                  </div>
                )}
                {venta.comentarios && (
                  <div className="col-span-2 sm:col-span-4">
                    <span className="block text-xs">Comentarios</span>
                    {venta.comentarios}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <EditarBoletaDialog boleta={boleta} open={editandoBoleta} onOpenChange={setEditandoBoleta} />
      {ventaEditando && (
        <EditarVentaItemDialog
          venta={ventaEditando}
          open={!!ventaEditando}
          onOpenChange={(open) => {
            if (!open) setVentaEditando(null);
          }}
        />
      )}
    </div>
  );
}
