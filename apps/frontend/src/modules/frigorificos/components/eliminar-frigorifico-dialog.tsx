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
import { useDeleteFrigorifico } from "@/modules/frigorificos/hooks/use-delete-frigorifico";
import { ApiError } from "@/shared/api/api-response";

interface EliminarFrigorificoDialogProps {
  frigorificoId: string;
  nombre: string;
}

/**
 * Soft-delete (ver `FrigorificoRepository.delete` en el backend): el
 * frigorífico deja de listarse, pero sus resultados de faena históricos no se
 * tocan. Se puede reactivar después (ver `ReactivarFrigorificoButton`).
 */
export function EliminarFrigorificoDialog({ frigorificoId, nombre }: EliminarFrigorificoDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteFrigorifico = useDeleteFrigorifico();

  function handleEliminar() {
    deleteFrigorifico.mutate(frigorificoId, {
      onSuccess: () => {
        toast.success("Frigorífico puesto en inactivo correctamente");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el frigorífico");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Poner en inactivo">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Poner en inactivo a {nombre}?</DialogTitle>
          <DialogDescription>
            Deja de aparecer en los listados y selectores. No afecta resultados de faena ya
            cargados a su nombre, y se puede reactivar después.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={deleteFrigorifico.isPending}>
            {deleteFrigorifico.isPending ? "Guardando..." : "Poner en inactivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
