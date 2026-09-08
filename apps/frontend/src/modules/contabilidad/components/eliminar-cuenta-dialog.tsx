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
import { useEliminarCuenta } from "@/modules/contabilidad/hooks/use-eliminar-cuenta";
import type { Cuenta } from "@/modules/contabilidad/domain/cuenta.types";
import { ApiError } from "@/shared/api/api-response";

interface EliminarCuentaDialogProps {
  cuenta: Cuenta;
}

/** Si la cuenta ya tiene movimientos, el backend la desactiva en vez de borrarla — el mensaje avisa cuál pasó. */
export function EliminarCuentaDialog({ cuenta }: EliminarCuentaDialogProps) {
  const [open, setOpen] = useState(false);
  const eliminar = useEliminarCuenta();

  function handleConfirmar() {
    eliminar.mutate(cuenta.id, {
      onSuccess: (resultado) => {
        toast.success(resultado.mensaje);
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo borrar la cuenta");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Borrar cuenta">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Borrar "{cuenta.codigo} {cuenta.nombre}"?</DialogTitle>
          <DialogDescription>
            Si nunca tuvo movimientos se borra del todo. Si ya tiene asientos imputados, se desactiva en vez
            de borrarse — su historia sigue viéndose en el mayor.
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
