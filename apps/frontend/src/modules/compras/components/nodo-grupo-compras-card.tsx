import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ComprasTable } from "@/modules/compras/components/compras-table";
import type { NodoGrupoCompras } from "@/modules/compras/domain/agrupar-compras";
import type { Proveedor } from "@/modules/proveedores/domain/proveedor.types";
import { cn } from "@/lib/utils";

interface NodoGrupoComprasCardProps {
  nodo: NodoGrupoCompras;
  proveedores: Proveedor[];
  puedeEditar?: boolean;
  /** Profundidad de anidado (0 = nivel superior) — solo afecta el estilo, para que se note visualmente la jerarquía. */
  nivel?: number;
}

/**
 * Una sección plegable de tropas agrupadas — si `nodo.subgrupos` no es null
 * sigue bajando un nivel más (ej. "Agosto 2026" → "Motape"/"Los Llanos"
 * adentro), y si es null (hoja) muestra la tabla de tropas de esa rama. Se
 * puede combinar cualquier cantidad de criterios a la vez (ver
 * `agruparComprasAnidado`), este componente no le pone límite a cuánto anida.
 */
export function NodoGrupoComprasCard({ nodo, proveedores, puedeEditar, nivel = 0 }: NodoGrupoComprasCardProps) {
  const [abierto, setAbierto] = useState(true);

  return (
    <Card className={cn(nivel > 0 && "border-l-primary/40 border-l-4")}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="hover:bg-accent/50 flex w-full items-center justify-between gap-2 rounded-t-xl px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-medium">
          {abierto ? <ChevronDown className="text-muted-foreground size-4" /> : <ChevronRight className="text-muted-foreground size-4" />}
          {nodo.titulo}
        </span>
        <span className="text-muted-foreground text-sm">
          {nodo.compras.length} tropa{nodo.compras.length === 1 ? "" : "s"}
        </span>
      </button>
      {abierto && (
        <CardContent className="pt-0">
          {nodo.subgrupos ? (
            <div className="space-y-3">
              {nodo.subgrupos.map((sub) => (
                <NodoGrupoComprasCard
                  key={sub.clave}
                  nodo={sub}
                  proveedores={proveedores}
                  puedeEditar={puedeEditar}
                  nivel={nivel + 1}
                />
              ))}
            </div>
          ) : (
            <ComprasTable compras={nodo.compras} proveedores={proveedores} puedeEditar={puedeEditar} />
          )}
        </CardContent>
      )}
    </Card>
  );
}
