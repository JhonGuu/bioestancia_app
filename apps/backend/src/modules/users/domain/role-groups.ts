import { Roles } from "@/modules/users/domain/roles";

/**
 * Grupos de roles preconfigurados, para no repetir arrays de strings
 * en cada controller.
 *
 * Importá uno de estos en el campo `roles: [...]` de `httpServer.register()`.
 *
 * Sumá grupos nuevos acá a medida que agregues roles (ej. Staff, StaffAndVets, etc).
 */
export const RoleGroups = {
  /** Solo administradores. Usar para acciones críticas (delete, etc). */
  AdminOnly: [Roles.ADMIN] as string[],

  /** Cualquier usuario autenticado (sin restricción de rol). */
  AnyAuthenticated: [] as string[],
} as const;
