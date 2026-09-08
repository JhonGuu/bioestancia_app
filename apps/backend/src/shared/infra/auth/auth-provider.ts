/**
 * Datos básicos de identidad de un usuario (sin empresa/rol). Alcanza para
 * rutas `auth: "jwt"` que no necesitan contexto de empresa (ej. /account/me).
 */
export interface AuthenticatedIdentity {
  id: string;
  isActive: boolean;
  /**
   * Si está en `true`, el usuario tiene que cambiar su contraseña antes de
   * poder operar cualquier ruta `jwt-empresa` (ver `HttpServer.buildAuthMiddleware`).
   * Las rutas `jwt` puras (`/account/me`, `/account/change-password`, etc.)
   * siguen permitidas para que el usuario pueda completar el cambio.
   */
  mustChangePassword: boolean;
}

/**
 * Acceso de un usuario a una empresa puntual: el rol que tiene ahí.
 * Null si el usuario no tiene acceso a esa empresa.
 */
export interface EmpresaAccess {
  rol: string;
  /**
   * Códigos de permiso granular (ver `modules/permisos/domain/permiso.ts`)
   * que tiene este acceso — capa ortogonal al rol, resuelta contra la DB en
   * cada request igual que el rol (nunca se confía en el JWT para esto).
   */
  permisos: string[];
}

/**
 * Abstracción para que el HttpServer (que vive en shared/infra) no dependa
 * directamente del módulo users.
 *
 * El módulo users provee la implementación concreta (UsersAuthProvider).
 */
export interface AuthProvider {
  /** Devuelve identidad básica del usuario. Null si no existe. */
  getIdentity(userId: string): Promise<AuthenticatedIdentity | null>;

  /**
   * Resuelve el rol de un usuario en una empresa puntual, consultando
   * `usuario_empresas`. Null si el usuario no tiene acceso a esa empresa —
   * esto es lo que hace que la empresa activa (header `X-Empresa-Id`) nunca
   * se confíe del cliente sin validar contra la DB.
   */
  getAccessForEmpresa(userId: string, empresaId: string): Promise<EmpresaAccess | null>;
}
