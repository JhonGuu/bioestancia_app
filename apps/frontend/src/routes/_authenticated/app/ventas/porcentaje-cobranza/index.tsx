import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Permisos } from "@/modules/auth/domain/auth.types";
import { useTienePermiso } from "@/modules/auth/hooks/use-tiene-permiso";
import { SinPermiso } from "@/shared/components/sin-permiso";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { usePorcentajeCobranza } from "@/modules/porcentaje-cobranza/hooks/use-porcentaje-cobranza";
import { PorcentajeCobranzaTable } from "@/modules/porcentaje-cobranza/components/porcentaje-cobranza-table";
import { BandaCobranzaLegend } from "@/modules/porcentaje-cobranza/components/banda-cobranza-legend";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/ventas/porcentaje-cobranza/")({
  component: PorcentajeCobranzaPage,
});

function anioActual(): number {
  return new Date().getFullYear();
}

function PorcentajeCobranzaPage() {
  const [anio, setAnio] = useState(anioActual());

  const porcentajeQuery = usePorcentajeCobranza(anio);
  const clientesQuery = useClientes();
  const tieneAcceso = useTienePermiso(Permisos.VER_PORCENTAJE_COBRANZA);

  if (!tieneAcceso) {
    return <SinPermiso />;
  }

  const cargando = porcentajeQuery.isPending || clientesQuery.isPending;
  const error = porcentajeQuery.error ?? clientesQuery.error;

  // Últimos 2 años + actual + próximo — cubre lo que alguien va a querer mirar sin volverse eterno.
  const opcionesAnio = [anioActual() - 2, anioActual() - 1, anioActual(), anioActual() + 1];

  return (
    <div className="space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/ventas">
            <ArrowLeft className="size-4" />
            Ventas
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Porcentaje de cobranza</h1>
            <p className="text-muted-foreground text-sm">
              % de la deuda vencida que se cobró cada semana (lunes a domingo), por cliente — sin contar la
              venta nueva de esa semana.
            </p>
          </div>
          <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {opcionesAnio.map((a) => (
                <SelectItem key={a} value={String(a)}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <BandaCobranzaLegend />

      {cargando ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando...
        </div>
      ) : error ? (
        <p className="text-destructive py-16 text-center text-sm">{error.message}</p>
      ) : (
        <PorcentajeCobranzaTable clientes={clientesQuery.data ?? []} datos={porcentajeQuery.data ?? []} />
      )}
    </div>
  );
}
