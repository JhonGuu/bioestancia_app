import { Roles } from "@/modules/users/domain/roles";

/**
 * Grupos de roles preconfigurados, para no repetir arrays de strings
 * en cada controller.
 *
 * Importá uno de estos en el campo `roles: [...]` de `httpServer.register()`.
 * Recordá que el rol se resuelve siempre sobre la empresa activa (header
 * `X-Empresa-Id`) — estos grupos solo tienen sentido en rutas con `auth: "jwt-empresa"`.
 *
 * Sumá grupos nuevos acá a medida que agregues roles (ej. Staff, StaffAndVets, etc).
 */
export const RoleGroups = {
  /** Solo administradores de la empresa activa. Usar para acciones críticas (delete, etc). */
  AdminOnly: [Roles.ADMIN] as string[],

  /** Administración y contaduría — ventas, gastos, facturación. */
  AdminAndContable: [Roles.ADMIN, Roles.CONTABLE] as string[],

  /** Administración y sanidad — control veterinario. */
  AdminAndVeterinario: [Roles.ADMIN, Roles.VETERINARIO] as string[],

  /** Cualquier usuario con acceso a la empresa activa (sin restricción de rol). */
  AnyAuthenticated: [] as string[],
} as const;
