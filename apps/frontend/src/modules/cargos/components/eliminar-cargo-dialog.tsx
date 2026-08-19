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
import { useDeleteCargo } from "@/modules/cargos/hooks/use-delete-cargo";
import { ApiError } from "@/shared/api/api-response";

interface EliminarCargoDialogProps {
  cargoId: string;
  nombre: string;
}

/**
 * Soft-delete (ver `CargoRepository.delete` en el backend): el cargo deja de
 * listarse, pero los empleados que ya lo tienen asignado no se tocan. Se
 * puede reactivar después (ver `ReactivarCargoButton`).
 */
export function EliminarCargoDialog({ cargoId, nombre }: EliminarCargoDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteCargo = useDeleteCargo();

  function handleEliminar() {
    deleteCargo.mutate(cargoId, {
      onSuccess: () => {
        toast.success("Cargo puesto en inactivo correctamente");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el cargo");
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
            Deja de aparecer en los listados y selectores. No afecta a los empleados que ya lo
            tienen asignado, y se puede reactivar después.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={deleteCargo.isPending}>
            {deleteCargo.isPending ? "Guardando..." : "Poner en inactivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
