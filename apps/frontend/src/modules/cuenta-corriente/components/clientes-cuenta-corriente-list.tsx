import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { nombreCliente, documentoCliente, type Cliente } from "@/modules/clientes/domain/cliente.types";

interface ClientesCuentaCorrienteListProps {
  clientes: Cliente[];
}

/** Elegí un cliente para ver su resumen de cuenta corriente completo. */
export function ClientesCuentaCorrienteList({ clientes }: ClientesCuentaCorrienteListProps) {
  const [busqueda, setBusqueda] = useState("");

  const busquedaNormalizada = busqueda.trim().toLowerCase();
  const resultados = (busquedaNormalizada
    ? clientes.filter((c) => nombreCliente(c).toLowerCase().includes(busquedaNormalizada))
    : clientes
  ).filter((c) => c.activo);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar cliente..."
          className="pl-9"
        />
      </div>

      {resultados.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">Sin resultados.</p>
      )}

      <div className="flex flex-col gap-2">
        {resultados.map((cliente) => (
          <Link
            key={cliente.id}
            to="/app/ventas/cuenta-corriente/$clienteId"
            params={{ clienteId: cliente.id }}
            className="hover:bg-accent flex items-center justify-between rounded-md border p-3"
          >
            <span className="font-medium">{nombreCliente(cliente)}</span>
            <span className="text-muted-foreground text-xs">{documentoCliente(cliente)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
