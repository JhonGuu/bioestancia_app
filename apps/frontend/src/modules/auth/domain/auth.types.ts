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
  /** Carga boletas desde el reparto (celular) — no ve precios. */
  OPERARIO: "operario",
} as const;
export type Roles = (typeof Roles)[keyof typeof Roles];

/** Ver `apps/backend/src/modules/empresas/domain/empresa.ts`. */
export const Rubro = {
  FRIGORIFICO: "frigorifico",
  REVENDEDORA: "revendedora",
} as const;
export type Rubro = (typeof Rubro)[keyof typeof Rubro];

/**
 * Ver `apps/backend/src/modules/permisos/domain/permiso.ts`.
 *
 * Capa ORTOGONAL al rol: el rol gobierna qué acciones puede hacer alguien,
 * el permiso gobierna qué información sensible puede VER — 100% explícito,
 * ni siquiera el rol `admin` lo tiene por default. Igual que `Roles`, es un
 * objeto `as const` (no `enum`) por `erasableSyntaxOnly`.
 */
export const Permisos = {
  /** Compras → Informes: costo vs. ingreso por tropa, márgenes, evolución de precios. */
  VER_RENTABILIDAD_COMPRAS: "ver_rentabilidad_compras",
  /** Saldos y movimientos de cuenta corriente de clientes. */
  VER_CUENTA_CORRIENTE: "ver_cuenta_corriente",
  /** Informe de cobranzas (Excel/PDF). */
  VER_INFORME_COBRANZAS: "ver_informe_cobranzas",
  /** Porcentaje de cobranza. */
  VER_PORCENTAJE_COBRANZA: "ver_porcentaje_cobranza",
  /** Cheques en cartera. */
  VER_CHEQUES: "ver_cheques",
  /** Listas de precios internas. */
  VER_LISTAS_PRECIOS: "ver_listas_precios",
  /** Liquidaciones (de compra y de faena) — una sola vista: quien ve una, ve la otra. */
  VER_LIQUIDACIONES: "ver_liquidaciones",
  /** Módulo contable completo: plan de cuentas, asientos, diario, mayores. */
  VER_CONTABILIDAD: "ver_contabilidad",
  /** Tocar la estructura contable: plan de cuentas, centros de costo, ejercicios. */
  ADMINISTRAR_PLAN_CUENTAS: "administrar_plan_cuentas",
  /** Cerrar y reabrir períodos/ejercicios. */
  CERRAR_PERIODOS: "cerrar_periodos",
  /** Crear/editar/borrar reglas de asiento automático (fase 2). */
  ADMINISTRAR_REGLAS_ASIENTO: "administrar_reglas_asiento",
} as const;
export type Permisos = (typeof Permisos)[keyof typeof Permisos];

/** Usuario autenticado. Sin rol: el rol es siempre relativo a una empresa. */
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  /** Si está en `true`, hay que cambiar la contraseña antes de operar la app (ver `ForcedChangePasswordScreen`). */
  mustChangePassword: boolean;
  createdAt: string;
}

/** Empresa a la que el usuario tiene acceso, con su rol y sus permisos en esa empresa. */
export interface EmpresaAcceso {
  empresaId: string;
  razonSocial: string;
  rubro: Rubro;
  rol: Roles;
  /** Vistas sensibles habilitadas para este usuario en esta empresa — ver `Permisos`. */
  permisos: Permisos[];
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInOutput {
  token: string;
  empresas: EmpresaAcceso[];
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
