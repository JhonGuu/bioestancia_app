import { useState } from "react";
import { Pencil } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Roles } from "@/modules/auth/domain/auth.types";
import { ROL_LABELS } from "@/modules/usuarios/domain/rol-labels";
import { useEditarRolUsuario } from "@/modules/usuarios/hooks/use-editar-rol-usuario";
import type { UsuarioConAcceso } from "@/modules/usuarios/domain/usuario.types";
import { ApiError } from "@/shared/api/api-response";

interface EditarRolDialogProps {
  usuario: UsuarioConAcceso;
}

/** Reutiliza `POST /account/access` — con el mismo email ya existente, actualiza el rol en vez de crear un acceso nuevo. */
export function EditarRolDialog({ usuario }: EditarRolDialogProps) {
  const [open, setOpen] = useState(false);
  const [rol, setRol] = useState<Roles>(usuario.rol);
  const editarRol = useEditarRolUsuario();

  function handleGuardar() {
    editarRol.mutate(
      { email: usuario.email, rol },
      {
        onSuccess: () => {
          toast.success("Rol actualizado correctamente");
          setOpen(false);
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el rol");
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) setRol(usuario.rol);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Editar rol">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Editar rol de {usuario.firstName} {usuario.lastName}
          </DialogTitle>
          <DialogDescription>
            El rol nuevo aplica a partir de su próxima acción — no hace falta que vuelva a iniciar sesión.
          </DialogDescription>
        </DialogHeader>
        <Select value={rol} onValueChange={(value) => setRol(value as Roles)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Roles).map((valor) => (
              <SelectItem key={valor} value={valor}>
                {ROL_LABELS[valor]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={editarRol.isPending}>
            {editarRol.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
