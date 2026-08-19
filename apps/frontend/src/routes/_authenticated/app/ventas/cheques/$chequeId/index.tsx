import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useCheque } from "@/modules/cheques/hooks/use-cheque";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { CambiarEstadoChequeForm } from "@/modules/cheques/components/cambiar-estado-cheque-form";
import { RecargoChequeCard } from "@/modules/cheques/components/recargo-cheque-card";
import { RechazoChequeCard } from "@/modules/cheques/components/rechazo-cheque-card";
import { ESTADO_CHEQUE_BADGE_VARIANT, ESTADO_CHEQUE_LABELS } from "@/modules/cheques/domain/cheque.types";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/app/ventas/cheques/$chequeId/")({
  component: ChequeDetallePage,
});

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function ChequeDetallePage() {
  const { chequeId } = Route.useParams();
  const chequeQuery = useCheque(chequeId);
  const clientesQuery = useClientes();

  if (chequeQuery.isPending || clientesQuery.isPending) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Cargando cheque...
      </div>
    );
  }

  if (chequeQuery.error || !chequeQuery.data) {
    return (
      <p className="text-destructive py-16 text-center text-sm">
        {chequeQuery.error?.message ?? "No se encontró el cheque"}
      </p>
    );
  }

  const cheque = chequeQuery.data;
  const cliente = (clientesQuery.data ?? []).find((c) => c.id === cheque.clienteId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link to="/app/ventas/cheques" className="text-muted-foreground text-sm hover:underline">
          ← Volver a la cartera
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Cheque Nº {cheque.numero}</h1>
          <Badge variant={ESTADO_CHEQUE_BADGE_VARIANT[cheque.estado]}>
            {ESTADO_CHEQUE_LABELS[cheque.estado]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">{cliente ? nombreCliente(cliente) : "—"}</p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Banco</p>
            <p>{cheque.banco}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Monto</p>
            <p className="font-medium">{formatoMoneda.format(cheque.monto)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Fecha de emisión</p>
            <p>{new Date(cheque.fechaEmision).toLocaleDateString("es-AR", { timeZone: "UTC" })}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Fecha de pago</p>
            <p>{new Date(cheque.fechaPago).toLocaleDateString("es-AR", { timeZone: "UTC" })}</p>
          </div>
          {cheque.titular && (
            <div>
              <p className="text-muted-foreground text-xs">Titular</p>
              <p>{cheque.titular}</p>
            </div>
          )}
          {cheque.cuitLibrador && (
            <div>
              <p className="text-muted-foreground text-xs">CUIT del librador</p>
              <p>{cheque.cuitLibrador}</p>
            </div>
          )}
          {cheque.motivoRechazo && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-muted-foreground text-xs">Motivo del rechazo</p>
              <p>{cheque.motivoRechazo}</p>
            </div>
          )}
          {cheque.endosadoA && (
            <div>
              <p className="text-muted-foreground text-xs">Endosado a</p>
              <p>{cheque.endosadoA}</p>
            </div>
          )}
          {cheque.fechaEndoso && (
            <div>
              <p className="text-muted-foreground text-xs">Fecha de endoso</p>
              <p>{new Date(cheque.fechaEndoso).toLocaleDateString("es-AR", { timeZone: "UTC" })}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CambiarEstadoChequeForm cheque={cheque} />
      <RecargoChequeCard chequeId={cheque.id} />
      <RechazoChequeCard chequeId={cheque.id} estado={cheque.estado} />
    </div>
  );
}
