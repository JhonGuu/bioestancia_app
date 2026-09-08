import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { permisosUsuarioApi } from "@/modules/usuarios/api/permisos-usuario.api";

/** Reemplaza el set completo de permisos de un usuario en la empresa activa (admin-only). */
export function useSetPermisosUsuario() {
  const queryClient = useQueryClient();
  const { empresaActiva } = useAuth();

  return useMutation({
    mutationFn: permisosUsuarioApi.setPermisos,
    onSuccess: () => {
      // Invalida todos los `usePermisosUsuario` cacheados de esta empresa —
      // no sabemos qué usuarioId corresponde al email que se acaba de
      // editar sin buscarlo, y son pocas queries, así que invalidar por
      // prefijo es más simple que rastrearlo.
      void queryClient.invalidateQueries({ queryKey: ["permisos", "usuario", empresaActiva?.empresaId] });
    },
  });
}
