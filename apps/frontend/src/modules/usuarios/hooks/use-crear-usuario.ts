import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { usuariosApi } from "@/modules/usuarios/api/usuarios.api";

/** Crea un usuario + le otorga acceso a la empresa activa. Invalida la lista en caché. */
export function useCrearUsuario() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: usuariosApi.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios", empresaActiva?.empresaId] });
    },
  });
}
