import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { useBoletas } from "@/modules/boletas/hooks/use-boletas";
import { useSaldoCliente } from "@/modules/cuenta-corriente/hooks/use-saldo-cliente";
import { useMovimientosCuentaCorriente } from "@/modules/cuenta-corriente/hooks/use-movimientos-cuenta-corriente";
import {
  useDescargarResumenCuentaExcel,
  useDescargarResumenCuentaPdf,
} from "@/modules/cuenta-corriente/hooks/use-descargar-resumen-cuenta";
import { useCargosCuentaCorriente } from "@/modules/cargos-cuenta-corriente/hooks/use-cargos-cuenta-corriente";
import { SaldoClienteCards } from "@/modules/cuenta-corriente/components/saldo-cliente-cards";
import { MovimientosCuentaCorrienteList } from "@/modules/cuenta-corriente/components/movimientos-cuenta-corriente-list";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RangoFechasFiltro } from "@/shared/components/rango-fechas-filtro";
import { dentroDeRango, type RangoFechas } from "@/shared/lib/rango-fechas";

export const Route = createFileRoute("/_authenticated/app/ventas/cuenta-corriente/$clienteId/")({
  component: ResumenCuentaPage,
});

function ResumenCuentaPage() {
  const { clienteId } = Route.useParams();
  const [rango, setRango] = useState<RangoFechas | null>(null);

  const clientesQuery = useClientes();
  const boletasQuery = useBoletas();
  const saldoQuery = useSaldoCliente(clienteId);
  const movimientosQuery = useMovimientosCuentaCorriente(clienteId);
  const cargosQuery = useCargosCuentaCorriente(clienteId);
  const descargarPdf = useDescargarResumenCuentaPdf();
  const descargarExcel = useDescargarResumenCuentaExcel();
  const tieneAcceso = useTienePermiso(Permisos.VER_CUENTA_CORRIENTE);

  if (!tieneAcceso) {
    return <SinPermiso />;
  }

  const cargando =
    clientesQuery.isPending ||
    boletasQuery.isPending ||
    saldoQuery.isPending ||
    movimientosQuery.isPending ||
    cargosQuery.isPending;
  const error =
    clientesQuery.error ?? boletasQuery.error ?? saldoQuery.error ?? movimientosQuery.error ?? cargosQuery.error;

  if (cargando) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando resumen de cuenta...
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive py-16 text-center text-sm">{error.message}</p>;
  }

  const cliente = (clientesQuery.data ?? []).find((c) => c.id === clienteId);
  const movimientos = movimientosQuery.data ?? [];
  const movimientosFiltrados = rango ? movimientos.filter((m) => dentroDeRango(m.fecha, rango)) : movimientos;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link to="/app/ventas/cuenta-corriente" className="text-muted-foreground text-sm hover:underline">
            ← Volver a cuenta corriente
          </Link>
          <h1 className="text-2xl font-semibold">{cliente ? nombreCliente(cliente) : "Cliente"}</h1>
          <p className="text-muted-foreground text-sm">Resumen de cuenta corriente.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => descargarPdf.mutate(clienteId)}
            disabled={descargarPdf.isPending}
          >
            {descargarPdf.isPending ? <Loader2 className="animate-spin" /> : <FileDown />}
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => descargarExcel.mutate(clienteId)}
            disabled={descargarExcel.isPending}
          >
            {descargarExcel.isPending ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>
      </div>

      {saldoQuery.data && <SaldoClienteCards saldo={saldoQuery.data} />}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RangoFechasFiltro
            rango={rango}
            onChange={setRango}
            cantidadResultados={movimientosFiltrados.length}
            etiquetaResultados={movimientosFiltrados.length === 1 ? "movimiento" : "movimientos"}
          />
          <MovimientosCuentaCorrienteList
            movimientos={movimientosFiltrados}
            boletas={boletasQuery.data ?? []}
            cargos={cargosQuery.data ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
