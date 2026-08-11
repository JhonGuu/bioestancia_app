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
import { useDeleteProveedor } from "@/modules/proveedores/hooks/use-delete-proveedor";
import { ApiError } from "@/shared/api/api-response";

interface EliminarProveedorDialogProps {
  proveedorId: string;
  nombre: string;
}

/**
 * Soft-delete (ver `ProveedorRepository.delete` en el backend): el proveedor
 * deja de listarse, pero sus compras históricas no se tocan — por eso no
 * hace falta advertir sobre pérdida de datos relacionados. Se puede
 * reactivar después (ver `ReactivarProveedorButton`).
 */
export function EliminarProveedorDialog({ proveedorId, nombre }: EliminarProveedorDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteProveedor = useDeleteProveedor();

  function handleEliminar() {
    deleteProveedor.mutate(proveedorId, {
      onSuccess: () => {
        toast.success("Proveedor puesto en inactivo correctamente");
        setOpen(false);
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el proveedor");
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
            Deja de aparecer en los listados y selectores. No afecta compras ya cargadas a su
            nombre, y se puede reactivar después.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleEliminar} disabled={deleteProveedor.isPending}>
            {deleteProveedor.isPending ? "Guardando..." : "Poner en inactivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
