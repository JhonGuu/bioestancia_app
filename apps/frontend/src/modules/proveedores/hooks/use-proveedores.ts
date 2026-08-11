import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/modules/auth/context/auth-context";
import { proveedoresApi, type EstadoProveedorFiltro } from "@/modules/proveedores/api/proveedores.api";

/** Lista los proveedores de la empresa activa. `estado` filtra activos/inactivos/todos (default "activos"). */
export function useProveedores(estado: EstadoProveedorFiltro = "activos") {
  const { empresaActiva } = useAuth();

  return useQuery({
    queryKey: ["proveedores", empresaActiva?.empresaId, estado],
    queryFn: () => proveedoresApi.list(estado),
    enabled: !!empresaActiva,
  });
}
