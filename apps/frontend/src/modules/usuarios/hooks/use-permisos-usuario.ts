import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { permisosUsuarioApi } from "@/modules/usuarios/api/permisos-usuario.api";

/**
 * Permisos vigentes de un usuario puntual en la empresa activa — prefillea
 * el diálogo "Permisos" al abrirlo. `enabled` lo controla el diálogo (solo
 * pide esto cuando está abierto, para no pegarle a la API por cada fila de
 * la tabla).
 */
export function usePermisosUsuario(usuarioId: string, enabled: boolean) {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["permisos", "usuario", empresaActiva?.empresaId, usuarioId],
    queryFn: () => permisosUsuarioApi.getPermisosUsuario(usuarioId),
    enabled: enabled && !!empresaActiva,
  });
}
