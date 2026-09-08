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
import { useEliminarReglaAsiento } from "@/modules/contabilidad/hooks/use-eliminar-regla-asiento";
import type { ReglaAsiento } from "@/modules/contabilidad/domain/regla-asiento.types";
import { ApiError } from "@/shared/api/api-response";

export function EliminarReglaAsientoDialog({ regla }: { regla: ReglaAsiento }) {
  const [open, setOpen] = useState(false);
  const eliminar = useEliminarReglaAsiento();

  function handleConfirmar() {
    eliminar.mutate(regla.id, {
      onSuccess: () => {
        toast.success("Regla de asiento eliminada correctamente");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo borrar la regla de asiento");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Borrar regla de asiento">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Borrar "{regla.nombre}"?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Los asientos que ya se generaron con esta regla no se ven
            afectados — dejan de generarse los siguientes.
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
