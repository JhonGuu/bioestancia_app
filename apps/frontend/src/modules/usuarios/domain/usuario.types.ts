import type { Permisos, Roles } from "@/modules/auth/domain/auth.types";

/**
 * Espejo de `UsuarioConAcceso` en el backend
 * (`apps/backend/src/modules/users/domain/usuario-empresa.ts`).
 */
export interface UsuarioConAcceso {
  usuarioId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  rol: Roles;
  accesoDesde: string;
}

export interface UsuarioCreado {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface AccesoOtorgado {
  id: string;
  usuarioId: string;
  empresaId: string;
  rol: Roles;
  createdAt: string;
}

/** Respuesta de `POST /account/users` — incluye la contraseña temporal, UNA sola vez. */
export interface CrearUsuarioResult {
  user: UsuarioCreado;
  acceso: AccesoOtorgado;
  temporaryPassword: string;
}

/**
 * Metadata de un permiso para pintar el diálogo "Permisos" — espejo de
 * `PermisoCatalogoItem` en
 * `apps/backend/src/modules/permisos/domain/permiso-catalogo.ts`.
 */
export interface PermisoCatalogoItem {
  codigo: Permisos;
  categoria: string;
  etiqueta: string;
  descripcion: string;
}
