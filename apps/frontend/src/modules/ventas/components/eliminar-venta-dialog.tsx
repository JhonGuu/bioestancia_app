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
import { useDeleteVenta } from "@/modules/ventas/hooks/use-delete-venta";
import { ApiError } from "@/shared/api/api-response";

interface EliminarVentaDialogProps {
  ventaId: string;
}

/**
 * Borra (soft-delete) una línea de venta — si ya tenía cobros aplicados
 * (FIFO) contra la boleta, el exceso se libera como saldo a favor del
 * cliente automáticamente (ver `DeleteVenta` en el backend).
 */
export function EliminarVentaDialog({ ventaId }: EliminarVentaDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteVenta = useDeleteVenta();

  function handleEliminar() {
    deleteVenta.mutate(ventaId, {
      onSuccess: () => {
        toast.success("Ítem eliminado correctamente");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el ítem");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Eliminar ítem">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar este ítem?</DialogTitle>
          <DialogDescription>
            Se saca de la boleta. Si ya tenía un cobro aplicado, ese monto queda como saldo a favor
            del cliente.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={deleteVenta.isPending}>
            {deleteVenta.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
