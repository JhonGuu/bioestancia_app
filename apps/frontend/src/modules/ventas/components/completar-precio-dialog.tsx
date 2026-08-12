import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetPrecioVenta } from "@/modules/ventas/hooks/use-set-precio-venta";
import { ApiError } from "@/shared/api/api-response";
import type { Venta } from "@/modules/ventas/domain/venta.types";

interface CompletarPrecioDialogProps {
  venta: Venta;
  clienteNombre: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatoMoneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

/** Carga (o corrige) el precio por kg de una venta pendiente — recalcula el total en el servidor. */
export function CompletarPrecioDialog({
  venta,
  clienteNombre,
  open,
  onOpenChange,
}: CompletarPrecioDialogProps) {
  const [precioKg, setPrecioKg] = useState(venta.precioKg ? String(venta.precioKg) : "");
  const setPrecio = useSetPrecioVenta();

  const precioNumero = Number(precioKg);
  const totalPreview = precioKg && !Number.isNaN(precioNumero) ? venta.kg * precioNumero : null;

  function handleSubmit() {
    if (!precioKg || Number.isNaN(precioNumero) || precioNumero <= 0) {
      toast.error("Ingresá un precio válido");
      return;
    }
    setPrecio.mutate(
      { id: venta.id, precioKg: precioNumero },
      {
        onSuccess: () => {
          toast.success("Precio cargado correctamente");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el precio");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cargar precio</DialogTitle>
          <DialogDescription>
            {clienteNombre} · {venta.categoria} · {venta.kg} kg
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="precioKg">Precio por kg</Label>
          <Input
            id="precioKg"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            autoFocus
            value={precioKg}
            onChange={(e) => setPrecioKg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
          {totalPreview !== null && (
            <p className="text-muted-foreground text-sm">
              Total: {formatoMoneda.format(totalPreview)}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={setPrecio.isPending}>
            {setPrecio.isPending ? "Guardando..." : "Guardar precio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
