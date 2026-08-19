import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { usuariosApi } from "@/modules/usuarios/api/usuarios.api";

/** Activa/desactiva un usuario con acceso a la empresa activa. */
export function useSetUsuarioActivo() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: ({ usuarioId, isActive }: { usuarioId: string; isActive: boolean }) =>
      usuariosApi.setActivo(usuarioId, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["usuarios", empresaActiva?.empresaId] });
    },
  });
}
