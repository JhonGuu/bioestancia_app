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
import { useDeleteEmpleado } from "@/modules/empleados/hooks/use-delete-empleado";
import { ApiError } from "@/shared/api/api-response";

interface EliminarEmpleadoDialogProps {
  empleadoId: string;
  nombreCompleto: string;
}

/**
 * Soft-delete (ver `EmpleadoRepository.delete` en el backend): el empleado
 * deja de listarse, pero su legajo y horario quedan intactos y se puede
 * reactivar después (ver `ReactivarEmpleadoButton`).
 */
export function EliminarEmpleadoDialog({ empleadoId, nombreCompleto }: EliminarEmpleadoDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteEmpleado = useDeleteEmpleado();

  function handleEliminar() {
    deleteEmpleado.mutate(empleadoId, {
      onSuccess: () => {
        toast.success("Empleado puesto en inactivo correctamente");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el empleado");
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
          <DialogTitle>¿Poner en inactivo a {nombreCompleto}?</DialogTitle>
          <DialogDescription>
            Deja de aparecer en los listados y selectores. Su legajo y horario no se borran, y se
            puede reactivar después.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={deleteEmpleado.isPending}>
            {deleteEmpleado.isPending ? "Guardando..." : "Poner en inactivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
