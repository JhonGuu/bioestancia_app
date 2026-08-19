import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { usuariosApi } from "@/modules/usuarios/api/usuarios.api";

/** Lista los usuarios con acceso a la empresa activa, con su rol. Admin-only (ver backend). */
export function useUsuarios() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["usuarios", empresaActiva?.empresaId],
    queryFn: usuariosApi.list,
    enabled: !!empresaActiva,
  });
}
