import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { CuentaSelect } from "@/modules/contabilidad/components/cuenta-select";
import { aplanarArbol } from "@/modules/contabilidad/domain/cuenta.types";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { useConciliacionClientes } from "@/modules/cuenta-corriente/hooks/use-conciliacion-clientes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/contabilidad/reportes/conciliacion")({
  component: ConciliacionPage,
});

function ConciliacionPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const [cuentaId, setCuentaId] = useState("");

  const planCuentasQuery = usePlanCuentas();
  const cuentasControlCliente = (planCuentasQuery.data ? aplanarArbol(planCuentasQuery.data.arbol) : []).filter(
    (c) => c.imputable && c.activa && c.requiereAuxiliar === TipoAuxiliar.CLIENTE,
  );

  const conciliacionQuery = useConciliacionClientes(cuentaId || undefined);

  if (!tieneAcceso) return <SinPermiso />;

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/contabilidad">
            <ArrowLeft className="size-4" />
            Contabilidad
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Conciliación de clientes</h1>
        <p className="text-muted-foreground text-sm">
          Compara, cliente por cliente, el saldo de cuenta corriente contra el saldo contable confirmado de una
          cuenta de control. Una diferencia suele delatar un asiento automático todavía en borrador, un evento
          sin regla configurada, o un ajuste hecho de un solo lado.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 lg:col-span-2">
          <span className="text-muted-foreground text-xs">Cuenta de control</span>
          <CuentaSelect
            cuentas={cuentasControlCliente}
            value={cuentaId}
            onChange={setCuentaId}
            placeholder="Elegí una cuenta de clientes"
          />
        </div>
      </div>

      <Card>
        <CardContent>
          {!cuentaId ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Elegí una cuenta de control (ej. "Deudores por ventas") para conciliar.
            </p>
          ) : conciliacionQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Conciliando...
            </div>
          ) : conciliacionQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{conciliacionQuery.error.message}</p>
          ) : conciliacionQuery.data.filas.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Sin diferencias: no hay clientes con saldo distinto de cero en ninguno de los dos lados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Saldo cta. corriente</TableHead>
                  <TableHead className="text-right">Saldo contable</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conciliacionQuery.data.filas.map((fila) => {
                  const conDiferencia = Math.abs(fila.diferencia) > 0.01;
                  return (
                    <TableRow key={fila.clienteId} className={cn(conDiferencia && "bg-destructive/5")}>
                      <TableCell>{fila.nombreCliente}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fila.saldoAuxiliar.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{fila.saldoContable.toFixed(2)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-xs",
                          conDiferencia ? "text-destructive font-medium" : "text-muted-foreground",
                        )}
                      >
                        {fila.diferencia.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {conciliacionQuery.data.totalAuxiliar.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {conciliacionQuery.data.totalContable.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono text-xs",
                      Math.abs(conciliacionQuery.data.totalDiferencia) > 0.01
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {conciliacionQuery.data.totalDiferencia.toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
