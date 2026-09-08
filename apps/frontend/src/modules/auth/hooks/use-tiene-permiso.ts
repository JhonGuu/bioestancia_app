import { useAuth } from "@/modules/auth/context/auth-context";
import type { Permisos } from "@/modules/auth/domain/auth.types";

/**
 * ¿El usuario tiene este permiso en la empresa activa? Capa ortogonal al
 * rol — ver `Permisos` en `auth.types.ts`. Se usa tanto para ocultar
 * accesos (tarjetas de los dashboards de Compras/Ventas) como para cortar
 * el paso en las pantallas sensibles (ver `SinPermiso`).
 */
export function useTienePermiso(permiso: Permisos): boolean {
  const { empresaActiva } = useAuth();
  return (empresaActiva?.permisos ?? []).includes(permiso);
}
