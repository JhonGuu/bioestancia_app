import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { usuariosApi } from "@/modules/usuarios/api/usuarios.api";

/** Edita el rol de un usuario que ya tiene acceso a la empresa activa (reutiliza `POST /account/access`). */
export function useEditarRolUsuario() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: usuariosApi.editarRol,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios", empresaActiva?.empresaId] });
    },
  });
}
