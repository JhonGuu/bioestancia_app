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
import { Textarea } from "@/components/ui/textarea";
import { useUpdateVentaItem } from "@/modules/ventas/hooks/use-update-venta-item";
import { FormaVenta } from "@/modules/ventas/domain/venta.types";
import { ApiError } from "@/shared/api/api-response";
import type { Venta } from "@/modules/ventas/domain/venta.types";

interface EditarVentaItemDialogProps {
  venta: Venta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Corrige garrón/kg/categoría/comentarios de una línea ya cargada — para
 * arreglar una carga mal hecha. No toca precioKg (eso es
 * `CompletarPrecioDialog`). Los campos disponibles dependen de la forma de
 * venta: "compensación de kg" no tiene garrón ni categoría.
 */
export function EditarVentaItemDialog({ venta, open, onOpenChange }: EditarVentaItemDialogProps) {
  const esCompensacion = venta.formaVenta === FormaVenta.COMPENSACION_KG;
  const [garron, setGarron] = useState(venta.garron !== null ? String(venta.garron) : "");
  const [kg, setKg] = useState(String(esCompensacion ? Math.abs(venta.kg) : venta.kg));
  const [comentarios, setComentarios] = useState(venta.comentarios ?? "");
  const updateItem = useUpdateVentaItem();

  function handleSubmit() {
    const kgNumero = Number(kg);
    if (!kg || Number.isNaN(kgNumero) || kgNumero <= 0) {
      toast.error("Ingresá un peso válido, mayor a 0");
      return;
    }
    const garronNumero = garron ? Number(garron) : null;
    if (garron && (Number.isNaN(garronNumero) || (garronNumero ?? 0) <= 0)) {
      toast.error("El garrón tiene que ser un número mayor a 0");
      return;
    }

    updateItem.mutate(
      {
        id: venta.id,
        input: {
          garron: esCompensacion ? undefined : garronNumero,
          kg: esCompensacion ? -kgNumero : kgNumero,
          comentarios: comentarios.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Venta actualizada correctamente");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la venta");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar ítem</DialogTitle>
          <DialogDescription>Corregí una carga mal hecha. No se puede tocar el precio acá.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!esCompensacion && (
            <div className="space-y-2">
              <Label htmlFor="garron">Garrón</Label>
              <Input
                id="garron"
                type="number"
                inputMode="numeric"
                min="1"
                value={garron}
                onChange={(e) => setGarron(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="kg">{esCompensacion ? "Kg a descontar" : "Peso (kg)"}</Label>
            <Input
              id="kg"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="comentarios">Comentarios</Label>
            <Textarea
              id="comentarios"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={updateItem.isPending}>
            {updateItem.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
