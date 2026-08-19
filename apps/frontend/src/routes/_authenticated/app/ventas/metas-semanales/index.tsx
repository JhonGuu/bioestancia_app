import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { useClientes } from "@/modules/clientes/hooks/use-clientes";
import { useProgresoMetasSemanales } from "@/modules/metas-semanales/hooks/use-progreso-metas-semanales";
import { ProgresoMetaSemanalCard } from "@/modules/metas-semanales/components/progreso-meta-semanal-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/ventas/metas-semanales/")({
  component: MetasSemanalesPage,
});

function MetasSemanalesPage() {
  const progresoQuery = useProgresoMetasSemanales();
  const clientesQuery = useClientes();

  const cargando = progresoQuery.isPending || clientesQuery.isPending;
  const error = progresoQuery.error ?? clientesQuery.error;
  const clientesPorId = new Map((clientesQuery.data ?? []).map((c) => [c.id, c]));

  // Los que ya llegaron a la meta primero — son los que necesitan una acción (fijar precio con descuento).
  const progreso = [...(progresoQuery.data ?? [])].sort((a, b) => Number(b.cumplida) - Number(a.cumplida));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link to="/app/ventas">
            <ArrowLeft className="size-4" />
            Ventas
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Metas semanales</h1>
        <p className="text-muted-foreground text-sm">
          Clientes con meta de cabezas configurada, progreso de esta semana (lunes a domingo — no se compensa
          entre semanas). Si un cliente llega a la meta, aplicá el descuento a mano con "Agregar precio a
          boletas".
        </p>
      </div>

      {cargando ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Cargando progreso...
        </div>
      ) : error ? (
        <p className="text-destructive py-16 text-center text-sm">{error.message}</p>
      ) : progreso.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          Ningún cliente tiene una meta semanal configurada todavía — se agrega desde su ficha.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {progreso.map((p) => (
            <ProgresoMetaSemanalCard key={p.clienteId} progreso={p} cliente={clientesPorId.get(p.clienteId)} />
          ))}
        </div>
      )}
    </div>
  );
}
