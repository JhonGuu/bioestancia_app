import { createFileRoute, Link } from "@tanstack/react-router";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useBoleta } from "@/modules/boletas/hooks/use-boleta";
import { useDescargarBoletaPdf } from "@/modules/boletas/hooks/use-descargar-boleta-pdf";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { useCompras } from "@/modules/compras/hooks/use-compras";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { FORMA_VENTA_LABELS } from "@/modules/ventas/domain/venta.types";
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
            {new Date(boleta.fecha).toLocaleDateString("es-AR")}
          </p>
        </div>
        <Button variant="outline" onClick={handleDescargarPdf} disabled={descargarPdf.isPending}>
          {descargarPdf.isPending ? <Loader2 className="animate-spin" /> : <FileDown />}
          <span className="hidden sm:inline">Descargar PDF</span>
        </Button>
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
                {venta.precioKg === null ? (
                  <Badge variant="outline">Pendiente de precio</Badge>
                ) : (
                  <Badge variant="secondary">${venta.total?.toLocaleString("es-AR")}</Badge>
                )}
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
