/**
 * Roles válidos del sistema. Sirve para autorización (qué puede hacer cada usuario).
 *
 *   - admin: acceso total al sistema.
 *
 * Por ahora es el único rol (arranque simple). Para sumar uno nuevo (ej. "veterinario",
 * "operario", "gerente"):
 *   1. Agregá el valor acá.
 *   2. Se sincroniza solo en el enum de Postgres (infra/database/schema.ts lo deriva de acá).
 *   3. Corré `pnpm db:generate <nombre>` y `pnpm db:migrate`.
 *   4. Sumalo a los `RoleGroups` que corresponda (domain/role-groups.ts).
 *
 * String-enum (no numérico) para que sea legible en la DB.
 */
export enum Roles {
  ADMIN = "admin",
}
