import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import type { Boleta } from "@/modules/boletas/domain/boleta.types";
import type { Cliente } from "@/modules/clientes/domain/cliente.types";
import { nombreCliente } from "@/modules/clientes/domain/cliente.types";
import { Card, CardContent } from "@/components/ui/card";

interface BoletasListProps {
  boletas: Boleta[];
  clientes: Cliente[];
  /** Mensaje cuando la lista queda vacía — distinto si es "no hay ninguna" vs "ninguna en este período". */
  mensajeVacio?: string;
}

/**
 * Lista de boletas como tarjetas (no tabla): en una pantalla angosta una
 * tabla ancha obliga a hacer scroll horizontal, tarjetas apiladas no.
 */
export function BoletasList({
  boletas,
  clientes,
  mensajeVacio = "Todavía no hay boletas cargadas.",
}: BoletasListProps) {
  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

  if (boletas.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{mensajeVacio}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {boletas.map((boleta) => {
        const cliente = clientesPorId.get(boleta.clienteId);
        return (
          <Link key={boleta.id} to="/app/boletas/$boletaId" params={{ boletaId: boleta.id }}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardContent className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{cliente ? nombreCliente(cliente) : "—"}</p>
                  <p className="text-muted-foreground text-sm">
                    {new Date(boleta.fecha).toLocaleDateString("es-AR")}
                    {boleta.numero ? ` · N° ${boleta.numero}` : ""}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
