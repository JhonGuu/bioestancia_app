import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBalanceHoras } from "@/modules/balance-horas/hooks/use-balance-horas";
import { BalanceHorasTable } from "@/modules/balance-horas/components/balance-horas-table";
import { PeriodoBalance } from "@/modules/balance-horas/domain/balance-horas.types";
import { PERIODO_BALANCE_LABELS } from "@/modules/balance-horas/domain/periodo-balance-labels";
import { hoyISO } from "@/shared/lib/date";

export const Route = createFileRoute("/_authenticated/app/personal/balance-horas")({
  component: BalanceHorasPage,
});

function formatRango(desde: string, hasta: string): string {
  const opciones: Intl.DateTimeFormatOptions = { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" };
  const desdeFmt = new Date(`${desde}T00:00:00.000Z`).toLocaleDateString("es-AR", opciones);
  const hastaFmt = new Date(`${hasta}T00:00:00.000Z`).toLocaleDateString("es-AR", opciones);
  return `${desdeFmt} — ${hastaFmt}`;
}

function BalanceHorasPage() {
  const [periodo, setPeriodo] = useState<PeriodoBalance>(PeriodoBalance.QUINCENAL);
  const [fecha, setFecha] = useState(hoyISO());
  const balanceQuery = useBalanceHoras(periodo, fecha);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/app/personal">
          <ArrowLeft />
          Personal
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Balance de horas extra</h1>
        <p className="text-muted-foreground text-sm">
          Horas acumuladas por empleado en el período elegido — para decidir a quién no asignarle
          extras la próxima vez.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
              <Label className="text-muted-foreground text-xs">Tipo</Label>
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoBalance)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PeriodoBalance).map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {PERIODO_BALANCE_LABELS[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-muted-foreground text-xs">Fecha de referencia</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-40" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setFecha(hoyISO())}>
              Hoy
            </Button>
            {balanceQuery.data && (
              <span className="text-muted-foreground text-sm">
                Período: {formatRango(balanceQuery.data.desde, balanceQuery.data.hasta)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0 sm:px-6">
          {balanceQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Calculando balance...
            </div>
          ) : balanceQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{balanceQuery.error.message}</p>
          ) : (
            <BalanceHorasTable empleados={balanceQuery.data.empleados} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
