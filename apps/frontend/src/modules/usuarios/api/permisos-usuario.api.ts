import { httpClient, unwrap } from "@/shared/api/http-client";
import type { Permisos } from "@/modules/auth/domain/auth.types";
import type { PermisoCatalogoItem } from "@/modules/usuarios/domain/usuario.types";

export interface SetPermisosUsuarioInput {
  email: string;
  permisos: Permisos[];
}

/**
 * Endpoints del módulo `permisos` (backend) — capa ortogonal al rol, ver
 * `apps/backend/src/modules/permisos`. Todo admin-only, igual que `usuariosApi`.
 */
export const permisosUsuarioApi = {
  /** Catálogo completo con metadata (categoría/etiqueta/descripción) — alimenta los checkboxes del diálogo. */
  getCatalogo(): Promise<PermisoCatalogoItem[]> {
    return unwrap(httpClient.get("/account/permisos/catalogo"));
  },

  /** Permisos vigentes de un usuario puntual en la empresa activa. */
  getPermisosUsuario(usuarioId: string): Promise<Permisos[]> {
    return unwrap(httpClient.get(`/account/permisos/${usuarioId}`));
  },

  /** Reemplaza el set completo de permisos de un usuario (por email) en la empresa activa. */
  setPermisos(input: SetPermisosUsuarioInput): Promise<Permisos[]> {
    return unwrap(httpClient.put("/account/permisos", input));
  },
};
