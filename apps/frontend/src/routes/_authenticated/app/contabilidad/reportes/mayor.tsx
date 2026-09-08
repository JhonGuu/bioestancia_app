import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { usePlanCuentas } from "@/modules/contabilidad/hooks/use-plan-cuentas";
import { useMayorCuenta } from "@/modules/contabilidad/hooks/use-mayor-cuenta";
import { CuentaSelect } from "@/modules/contabilidad/components/cuenta-select";
import { AuxiliarPicker } from "@/modules/contabilidad/components/auxiliar-picker";
import { aplanarArbol } from "@/modules/contabilidad/domain/cuenta.types";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/app/contabilidad/reportes/mayor")({
  component: MayorPage,
});

function MayorPage() {
  const tieneAcceso = useTienePermiso(Permisos.VER_CONTABILIDAD);
  const [cuentaId, setCuentaId] = useState("");
  const [auxiliarId, setAuxiliarId] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const planCuentasQuery = usePlanCuentas();
  const cuentasImputables = (planCuentasQuery.data ? aplanarArbol(planCuentasQuery.data.arbol) : []).filter(
    (c) => c.imputable && c.activa,
  );
  const cuenta = cuentasImputables.find((c) => c.id === cuentaId);

  const mayorQuery = useMayorCuenta(
    cuentaId ? { cuentaId, desde: desde || undefined, hasta: hasta || undefined, auxiliarId: auxiliarId || undefined } : undefined,
  );

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
        <h1 className="text-2xl font-semibold">Mayor</h1>
        <p className="text-muted-foreground text-sm">
          Movimientos de una cuenta con saldo corrido. Si es una cuenta de control, se puede abrir por auxiliar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1 lg:col-span-2">
          <span className="text-muted-foreground text-xs">Cuenta</span>
          <CuentaSelect cuentas={cuentasImputables} value={cuentaId} onChange={setCuentaId} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Desde</span>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Hasta</span>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
        {cuenta && cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-muted-foreground text-xs">Abrir por {cuenta.requiereAuxiliar} (opcional)</span>
            <AuxiliarPicker tipo={cuenta.requiereAuxiliar} value={auxiliarId} onChange={setAuxiliarId} />
          </div>
        )}
      </div>

      <Card>
        <CardContent>
          {!cuentaId ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Elegí una cuenta para ver su mayor.</p>
          ) : mayorQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando mayor...
            </div>
          ) : mayorQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{mayorQuery.error.message}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>N°</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Debe</TableHead>
                  <TableHead className="text-right">Haber</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="text-muted-foreground">
                  <TableCell colSpan={5}>Saldo anterior</TableCell>
                  <TableCell className="text-right font-mono text-xs">{mayorQuery.data.saldoAnterior.toFixed(2)}</TableCell>
                </TableRow>
                {mayorQuery.data.movimientos.map((mov, i) => (
                  <TableRow key={`${mov.asientoId}-${i}`}>
                    <TableCell>{new Date(mov.fecha).toLocaleDateString("es-AR", { timeZone: "UTC" })}</TableCell>
                    <TableCell>{mov.numero ?? "—"}</TableCell>
                    <TableCell className="max-w-64 truncate">{mov.detalle ?? mov.descripcion}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{mov.debe > 0 ? mov.debe.toFixed(2) : ""}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{mov.haber > 0 ? mov.haber.toFixed(2) : ""}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{mov.saldo.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell colSpan={5}>Saldo final</TableCell>
                  <TableCell className="text-right font-mono text-xs">{mayorQuery.data.saldoFinal.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
