import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSetPrecioVentasLote } from "@/modules/ventas/hooks/use-set-precio-ventas-lote";
import { FORMA_VENTA_LABELS } from "@/modules/ventas/domain/venta.types";
import type { GrupoPrecioPendiente } from "@/modules/ventas/domain/agrupar-ventas-pendientes";
import { ApiError } from "@/shared/api/api-response";

interface PrecioGrupoFormProps {
  grupo: GrupoPrecioPendiente;
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/**
 * Un renglón de precio por categoría+presentación dentro de una boleta — un
 * solo precio se aplica a todos los ítems del grupo de una vez (`PATCH
 * /ventas/precio-lote`), en vez de cargarlos uno por uno.
 */
export function PrecioGrupoForm({ grupo }: PrecioGrupoFormProps) {
  const [precioKg, setPrecioKg] = useState("");
  const setPrecioLote = useSetPrecioVentasLote();

  const precioNumero = Number(precioKg);
  const totalPreview = precioKg && !Number.isNaN(precioNumero) ? grupo.totalKg * precioNumero : null;

  function handleSubmit() {
    if (!precioKg || Number.isNaN(precioNumero) || precioNumero <= 0) {
      toast.error("Ingresá un precio válido");
      return;
    }
    setPrecioLote.mutate(
      { ventaIds: grupo.ventas.map((v) => v.id), precioKg: precioNumero },
      {
        onSuccess: () => {
          toast.success(`Precio cargado en ${grupo.ventas.length} ítem(s)`);
          setPrecioKg("");
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el precio");
        },
      },
    );
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b py-3 last:border-b-0">
      <div>
        <p className="text-sm font-medium">
          {grupo.categoria ?? "Sin categoría"} · {FORMA_VENTA_LABELS[grupo.formaVenta]}
        </p>
        <p className="text-muted-foreground text-xs">
          {grupo.ventas.length} ítem{grupo.ventas.length === 1 ? "" : "s"} · {grupo.totalKg} kg
        </p>
      </div>

      <div className="flex items-end gap-2">
        <div>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="Precio/kg"
            className="w-32"
            value={precioKg}
            onChange={(e) => setPrecioKg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          {totalPreview !== null && (
            <p className="text-muted-foreground mt-1 text-xs">{formatoMoneda.format(totalPreview)}</p>
          )}
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={setPrecioLote.isPending}>
          {setPrecioLote.isPending ? "Guardando..." : `Aplicar a los ${grupo.ventas.length}`}
        </Button>
      </div>
    </div>
  );
}
