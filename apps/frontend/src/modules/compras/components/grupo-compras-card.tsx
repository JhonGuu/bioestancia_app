import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ComprasTable } from "@/modules/compras/components/compras-table";
import type { GrupoCompras } from "@/modules/compras/domain/agrupar-compras";
import type { Proveedor } from "@/modules/proveedores/domain/proveedor.types";

interface GrupoComprasCardProps {
  grupo: GrupoCompras;
  proveedores: Proveedor[];
  puedeEditar?: boolean;
  /** Abierto por defecto — false para grupos viejos, así una lista con muchos años/meses no abruma al entrar. */
  abiertoPorDefecto?: boolean;
}

/** Una sección plegable de `ComprasTable`, con su título de grupo (ej. "Agosto 2026", "Motape") y cantidad. */
export function GrupoComprasCard({ grupo, proveedores, puedeEditar, abiertoPorDefecto = true }: GrupoComprasCardProps) {
  const [abierto, setAbierto] = useState(abiertoPorDefecto);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="hover:bg-accent/50 flex w-full items-center justify-between gap-2 rounded-t-xl px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-medium">
          {abierto ? <ChevronDown className="text-muted-foreground size-4" /> : <ChevronRight className="text-muted-foreground size-4" />}
          {grupo.titulo}
        </span>
        <span className="text-muted-foreground text-sm">
          {grupo.compras.length} tropa{grupo.compras.length === 1 ? "" : "s"}
        </span>
      </button>
      {abierto && (
        <CardContent className="pt-0">
          <ComprasTable compras={grupo.compras} proveedores={proveedores} puedeEditar={puedeEditar} />
        </CardContent>
      )}
    </Card>
  );
}
