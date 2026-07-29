/**
 * Tipos de dominio del módulo auth, espejo de
 * `apps/backend/src/modules/users/domain/*`.
 */

/**
 * Ver `apps/backend/src/modules/users/domain/roles.ts`.
 *
 * Objeto `as const` en vez de `enum`: el tsconfig tiene `erasableSyntaxOnly`
 * (alineado con el soporte nativo de TS de Node/runtimes modernos, que no
 * pueden "borrar" un `enum` real porque genera código). Se usa exactamente
 * igual que un enum: `Roles.ADMIN` como valor, `Roles` como tipo.
 */
export const Roles = {
  ADMIN: "admin",
  CONTABLE: "contable",
  VETERINARIO: "veterinario",
} as const;
export type Roles = (typeof Roles)[keyof typeof Roles];

/** Ver `apps/backend/src/modules/empresas/domain/empresa.ts`. */
export const Rubro = {
  FRIGORIFICO: "frigorifico",
  REVENDEDORA: "revendedora",
} as const;
export type Rubro = (typeof Rubro)[keyof typeof Rubro];

/** Usuario autenticado. Sin rol: el rol es siempre relativo a una empresa. */
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Empresa a la que el usuario tiene acceso, con su rol en esa empresa. */
export interface EmpresaAcceso {
  empresaId: string;
  razonSocial: string;
  rubro: Rubro;
  rol: Roles;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInOutput {
  token: string;
  empresas: EmpresaAcceso[];
}
