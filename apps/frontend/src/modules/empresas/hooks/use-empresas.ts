import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { empresasApi } from "@/modules/empresas/api/empresas.api";

/**
 * Lista TODAS las empresas del sistema (`GET /empresas` es admin-only y no
 * filtra por acceso) — se usa para la pantalla "Datos de la empresa", que
 * busca ahí la que coincide con `empresaActiva`. Deshabilitado si el usuario
 * no es admin en la empresa activa, para no pegarle al endpoint y comerse un
 * 403 de entrada.
 */
export function useEmpresas() {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["empresas"],
    queryFn: empresasApi.list,
    enabled: empresaActiva?.rol === Roles.ADMIN,
  });
}
