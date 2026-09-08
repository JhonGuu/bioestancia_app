import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useAsiento } from "@/modules/contabilidad/hooks/use-asiento";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { ConfirmarAsientoButton } from "@/modules/contabilidad/components/confirmar-asiento-button";
import { AnularAsientoDialog } from "@/modules/contabilidad/components/anular-asiento-dialog";
import {
  ESTADO_ASIENTO_LABELS,
  EstadoAsiento,
  RESPALDO_LABELS,
  TIPO_ASIENTO_LABELS,
  calcularTotales,
} from "@/modules/contabilidad/domain/asiento.types";
import { aplanarArbol } from "@/modules/contabilidad/domain/cuenta.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/app/contabilidad/asientos/$asientoId/")({
  component: AsientoDetallePage,
});

function AsientoDetallePage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const { asientoId } = Route.useParams();
  const asientoQuery = useAsiento(asientoId);
  const planCuentasQuery = usePlanCuentas();

  if (!tieneAcceso) return <SinPermiso />;

  const cuentasPorId = new Map(
    (planCuentasQuery.data ? aplanarArbol(planCuentasQuery.data.arbol) : []).map((c) => [c.id, c]),
  );

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad/asientos">
            <ArrowLeft className="size-4" />
            Asientos
          </Link>
        </Button>
      </div>

      {asientoQuery.isPending ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando asiento...
        </div>
      ) : asientoQuery.isError ? (
        <p className="text-destructive py-8 text-center text-sm">{asientoQuery.error.message}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">
                Asiento {asientoQuery.data.numero ?? "(borrador)"}
              </h1>
              <p className="text-muted-foreground text-sm">{asientoQuery.data.descripcion}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {asientoQuery.data.estado !== EstadoAsiento.ANULADO && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/app/contabilidad/asientos/$asientoId/editar" params={{ asientoId }}>
                    <Pencil className="size-4" />
                    Editar
                  </Link>
                </Button>
              )}
              {asientoQuery.data.estado === EstadoAsiento.BORRADOR && (
                <ConfirmarAsientoButton asientoId={asientoId} />
              )}
              {asientoQuery.data.estado !== EstadoAsiento.ANULADO && (
                <AnularAsientoDialog asientoId={asientoId} estado={asientoQuery.data.estado} />
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    asientoQuery.data.estado === EstadoAsiento.CONFIRMADO
                      ? "default"
                      : asientoQuery.data.estado === EstadoAsiento.ANULADO
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {ESTADO_ASIENTO_LABELS[asientoQuery.data.estado]}
                </Badge>
                <Badge variant="outline">{TIPO_ASIENTO_LABELS[asientoQuery.data.tipo]}</Badge>
                <Badge variant="outline">{RESPALDO_LABELS[asientoQuery.data.respaldo]}</Badge>
                <span className="text-muted-foreground text-sm">
                  {new Date(asientoQuery.data.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asientoQuery.data.lineas.map((linea) => {
                    const cuenta = cuentasPorId.get(linea.cuentaId);
                    return (
                      <TableRow key={linea.id}>
                        <TableCell>
                          {cuenta ? `${cuenta.codigo} ${cuenta.nombre}` : linea.cuentaId}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{linea.detalle ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {linea.debe > 0 ? linea.debe.toFixed(2) : ""}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {linea.haber > 0 ? linea.haber.toFixed(2) : ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(() => {
                    const totales = calcularTotales(asientoQuery.data.lineas);
                    return (
                      <TableRow className="font-medium">
                        <TableCell colSpan={2}>Totales</TableCell>
                        <TableCell className="text-right font-mono text-xs">{totales.debe.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-xs">{totales.haber.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
