import { createFileRoute, Link } from "@tanstack/react-router";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";

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

export const Route = createFileRoute("/_authenticated/app/ventas/cuenta-corriente/$clienteId/")({
  component: ResumenCuentaPage,
});

function ResumenCuentaPage() {
  const { clienteId } = Route.useParams();

  const clientesQuery = useClientes();
  const boletasQuery = useBoletas();
  const saldoQuery = useSaldoCliente(clienteId);
  const movimientosQuery = useMovimientosCuentaCorriente(clienteId);
  const cargosQuery = useCargosCuentaCorriente(clienteId);
  const descargarPdf = useDescargarResumenCuentaPdf();
  const descargarExcel = useDescargarResumenCuentaExcel();

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
        <CardContent>
          <MovimientosCuentaCorrienteList
            movimientos={movimientosQuery.data ?? []}
            boletas={boletasQuery.data ?? []}
            cargos={cargosQuery.data ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
