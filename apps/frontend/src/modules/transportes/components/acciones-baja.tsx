import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
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
import { ApiError } from "@/shared/api/api-response";

interface BajaButtonProps {
  /** Ej. "el chofer", "el vehículo" — para el texto del diálogo. */
  entidad: string;
  nombre: string;
  onConfirm: () => Promise<unknown>;
  isPending: boolean;
}

/**
 * Baja lógica (nunca borra la fila): deja de aparecer en los listados y
 * selectores pero se puede reactivar, y no toca nada ya cargado.
 */
export function BajaButton({ entidad, nombre, onConfirm, isPending }: BajaButtonProps) {
  const [open, setOpen] = useState(false);

  async function handleConfirm() {
    try {
      await onConfirm();
      toast.success("Dado de baja correctamente");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : `No se pudo dar de baja ${entidad}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Dar de baja">
          <Trash2 className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Dar de baja {entidad} {nombre}?</DialogTitle>
          <DialogDescription>
            Deja de aparecer en los listados y en las listas de autorizados de los clientes. Se puede
            reactivar después.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Guardando..." : "Dar de baja"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReactivarButtonProps {
  entidad: string;
  onConfirm: () => Promise<unknown>;
  isPending: boolean;
}

/** Deshace la baja — acción reversible, sin confirmación. */
export function ReactivarButton({ entidad, onConfirm, isPending }: ReactivarButtonProps) {
  async function handleClick() {
    try {
      await onConfirm();
      toast.success("Reactivado correctamente");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : `No se pudo reactivar ${entidad}`);
    }
  }

  return (
    <Button variant="ghost" size="icon" title="Reactivar" onClick={handleClick} disabled={isPending}>
      <RotateCcw className="size-4" />
    </Button>
  );
}
