import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { permisosUsuarioApi } from "@/modules/usuarios/api/permisos-usuario.api";

/**
 * Catálogo de permisos con metadata — alimenta los checkboxes agrupados del
 * diálogo "Permisos". Admin-only, y estático durante la sesión (no cambia
 * sin un deploy), así que no hace falta revalidarlo.
 */
export function usePermisosCatalogo() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["permisos", "catalogo"],
    queryFn: permisosUsuarioApi.getCatalogo,
    enabled: empresaActiva?.rol === Roles.ADMIN,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
