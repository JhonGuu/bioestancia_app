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
import { useUpdateBoleta } from "@/modules/boletas/hooks/use-update-boleta";
import { ApiError } from "@/shared/api/api-response";
import type { Boleta } from "@/modules/boletas/domain/boleta.types";

interface EditarBoletaDialogProps {
  boleta: Boleta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Corrige fecha/número/comentarios de una boleta ya cargada — para arreglar
 * una carga mal hecha. Si cambia la fecha, el backend recalcula
 * `fechaVencimiento` solo. No toca los ítems (ver `EditarVentaItemDialog`).
 */
export function EditarBoletaDialog({ boleta, open, onOpenChange }: EditarBoletaDialogProps) {
  const [fecha, setFecha] = useState(boleta.fecha.slice(0, 10));
  const [numero, setNumero] = useState(boleta.numero ?? "");
  const [comentarios, setComentarios] = useState(boleta.comentarios ?? "");
  const updateBoleta = useUpdateBoleta();

  function handleSubmit() {
    if (!fecha) {
      toast.error("Indicá una fecha");
      return;
    }
    updateBoleta.mutate(
      {
        id: boleta.id,
        input: {
          fecha,
          numero: numero.trim() || null,
          comentarios: comentarios.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Boleta actualizada correctamente");
          onOpenChange(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la boleta");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar boleta</DialogTitle>
          <DialogDescription>Corregí una carga mal hecha.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero">N° de boleta</Label>
            <Input id="numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
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
          <Button onClick={handleSubmit} disabled={updateBoleta.isPending}>
            {updateBoleta.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
