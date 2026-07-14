/**
 * Información de autorización de un usuario.
 * El HttpServer la usa para validar roles en cada request.
 */
export interface AuthenticatedUser {
  id: string;
  role: string;
  isActive: boolean;
}

/**
 * Abstracción para que el HttpServer (que vive en shared/infra) no dependa
 * directamente del módulo users.
 *
 * El módulo users provee la implementación concreta (UsersAuthProvider).
 */
export interface AuthProvider {
  /** Devuelve los datos de autorización del usuario. Null si no existe. */
  getAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null>;
}
