import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useCheques } from "@/modules/cheques/hooks/use-cheques";
import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { ChequesTable } from "@/modules/cheques/components/cheques-table";
import { ChequesResumenCarteraCard } from "@/modules/cheques/components/cheques-resumen-cartera-card";
import { EstadoCheque, ESTADO_CHEQUE_LABELS } from "@/modules/cheques/domain/cheque.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/app/ventas/cheques/")({
  component: ChequesPage,
});

const TODOS = "todos" as const;

function ChequesPage() {
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoCheque | typeof TODOS>(TODOS);

  const chequesQuery = useCheques(estadoFiltro === TODOS ? undefined : { estado: estadoFiltro });
  // Independiente del filtro de la tabla — el resumen siempre muestra la cartera completa.
  const carteraQuery = useCheques({ estado: EstadoCheque.EN_CARTERA });
  const clientesQuery = useClientes();

  const cargando = chequesQuery.isPending || clientesQuery.isPending;
  const error = chequesQuery.error ?? clientesQuery.error;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2" asChild>
            <Link to="/app/ventas">
              <ArrowLeft className="size-4" />
              Ventas
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Cartera de cheques</h1>
          <p className="text-muted-foreground text-sm">
            Todos los cheques entregados por clientes — entrá a uno para cambiar su estado o confirmar
            recargo/comisión.
          </p>
        </div>
        <Select value={estadoFiltro} onValueChange={(v) => setEstadoFiltro(v as EstadoCheque | typeof TODOS)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los estados</SelectItem>
            {Object.values(EstadoCheque).map((valor) => (
              <SelectItem key={valor} value={valor}>
                {ESTADO_CHEQUE_LABELS[valor]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!carteraQuery.isPending && !carteraQuery.error && (
        <ChequesResumenCarteraCard chequesEnCartera={carteraQuery.data ?? []} />
      )}

      <Card>
        <CardContent>
          {cargando ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando cheques...
            </div>
          ) : error ? (
            <p className="text-destructive py-8 text-center text-sm">{error.message}</p>
          ) : (
            <ChequesTable cheques={chequesQuery.data ?? []} clientes={clientesQuery.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
