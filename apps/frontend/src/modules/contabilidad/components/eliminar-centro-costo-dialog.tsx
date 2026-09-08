import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEliminarCentroCosto } from "@/modules/contabilidad/hooks/use-eliminar-centro-costo";
import type { CentroCosto } from "@/modules/contabilidad/domain/centro-costo.types";
import { ApiError } from "@/shared/api/api-response";

export function EliminarCentroCostoDialog({ centro }: { centro: CentroCosto }) {
  const [open, setOpen] = useState(false);
  const eliminar = useEliminarCentroCosto();

  function handleConfirmar() {
    eliminar.mutate(centro.id, {
      onSuccess: (resultado) => {
        toast.success(resultado.mensaje);
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo borrar el centro de costo");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Borrar centro de costo">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Borrar "{centro.nombre}"?</DialogTitle>
          <DialogDescription>
            Si nunca se usó en un asiento se borra del todo. Si ya tiene movimientos imputados, se desactiva
            en vez de borrarse.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirmar} disabled={eliminar.isPending}>
            {eliminar.isPending ? "Procesando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
