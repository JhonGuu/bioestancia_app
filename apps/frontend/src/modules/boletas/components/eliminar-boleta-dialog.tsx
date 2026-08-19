import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
import { useDeleteBoleta } from "@/modules/boletas/hooks/use-delete-boleta";
import { ApiError } from "@/shared/api/api-response";

interface EliminarBoletaDialogProps {
  boletaId: string;
}

/**
 * Borra (soft-delete) la boleta entera y todas sus ventas — para arreglar
 * una carga mal hecha desde cero. Si ya tenía cobros aplicados (FIFO), se
 * liberan como saldo a favor del cliente automáticamente.
 */
export function EliminarBoletaDialog({ boletaId }: EliminarBoletaDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteBoleta = useDeleteBoleta();
  const navigate = useNavigate();

  function handleEliminar() {
    deleteBoleta.mutate(boletaId, {
      onSuccess: () => {
        toast.success("Boleta eliminada correctamente");
        setOpen(false);
        void navigate({ to: "/app/boletas" });
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la boleta");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <Trash2 />
          <span className="hidden sm:inline">Eliminar boleta</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar esta boleta?</DialogTitle>
          <DialogDescription>
            Se eliminan la boleta y todos sus ítems. Si ya tenía cobros aplicados, ese monto queda
            como saldo a favor del cliente. Esta acción no se puede deshacer desde acá.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={deleteBoleta.isPending}>
            {deleteBoleta.isPending ? "Eliminando..." : "Eliminar boleta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
