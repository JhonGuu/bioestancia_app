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
import { useDeleteCliente } from "@/modules/clientes/hooks/use-delete-cliente";
import { ApiError } from "@/shared/api/api-response";

interface EliminarClienteDialogProps {
  clienteId: string;
  nombre: string;
}

/**
 * Soft-delete (ver `ClienteRepository.delete` en el backend): el cliente
 * deja de listarse, pero sus ventas/boletas históricas no se tocan — por eso
 * no hace falta advertir sobre pérdida de datos relacionados.
 */
export function EliminarClienteDialog({ clienteId, nombre }: EliminarClienteDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteCliente = useDeleteCliente();

  function handleEliminar() {
    deleteCliente.mutate(clienteId, {
      onSuccess: () => {
        toast.success("Cliente eliminado correctamente");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el cliente");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Eliminar cliente">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar a {nombre}?</DialogTitle>
          <DialogDescription>
            Deja de aparecer en los listados y selectores. No afecta ventas o boletas ya cargadas
            a su nombre.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={deleteCliente.isPending}>
            {deleteCliente.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
