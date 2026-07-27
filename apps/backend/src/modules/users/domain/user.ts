/**
 * Representación del User en el dominio (sin datos sensibles ni de infraestructura).
 * Esto es lo que devuelven los use-cases al exterior.
 *
 * Notá que NO tiene `role`: el rol es siempre relativo a una empresa y vive en
 * `usuario_empresas` (ver domain/usuario-empresa.ts), no en el usuario.
 */
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Datos completos del User incluyendo los sensibles. Solo el repositorio devuelve esto;
 * los use-cases lo filtran antes de exponerlo (ver `toPublicUser` abajo).
 */
export interface UserWithCredentials extends User {
  passwordHash: string;
}

/**
 * Helper: convierte un UserWithCredentials a User público (sin password).
 * Lo usamos cuando un use-case obtiene un user del repo y lo va a devolver al caller.
 */
export function toPublicUser(user: UserWithCredentials): User {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
