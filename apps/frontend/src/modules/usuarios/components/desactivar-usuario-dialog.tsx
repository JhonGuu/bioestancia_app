import { useState } from "react";
import { UserX } from "lucide-react";
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
import { useSetUsuarioActivo } from "@/modules/usuarios/hooks/use-set-usuario-activo";
import { ApiError } from "@/shared/api/api-response";

interface DesactivarUsuarioDialogProps {
  usuarioId: string;
  nombre: string;
}

/** Desactiva el usuario (`User.isActive = false`): no puede volver a iniciar sesión hasta reactivarlo. */
export function DesactivarUsuarioDialog({ usuarioId, nombre }: DesactivarUsuarioDialogProps) {
  const [open, setOpen] = useState(false);
  const setActivo = useSetUsuarioActivo();

  function handleDesactivar() {
    setActivo.mutate(
      { usuarioId, isActive: false },
      {
        onSuccess: () => {
          toast.success("Usuario desactivado correctamente");
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo desactivar el usuario");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Desactivar usuario">
          <UserX className="text-destructive size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Desactivar a {nombre}?</DialogTitle>
          <DialogDescription>
            No va a poder iniciar sesión hasta que lo reactives. Se puede deshacer en cualquier momento.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDesactivar} disabled={setActivo.isPending}>
            {setActivo.isPending ? "Guardando..." : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
