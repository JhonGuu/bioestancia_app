/**
 * Roles válidos del sistema. Sirve para autorización (qué puede hacer cada usuario).
 *
 *   - admin: acceso total a la empresa donde tiene este rol.
 *   - contable: gestión contable/administrativa (ventas, gastos, facturación).
 *   - veterinario: tareas sanitarias (control, vacunación, decomiso).
 *   - operario: carga boletas desde el reparto (planta/entrega) — cliente,
 *     tropa, categoría/presentación y kg. No carga precio (eso lo completa
 *     alguien de administración/contable después, ver
 *     `modules/ventas/use-cases/set-precio-venta.use-case.ts`).
 *
 * IMPORTANTE: el rol es siempre relativo a una empresa — vive en la tabla
 * `usuario_empresas` (domain/usuario-empresa.ts), NO en `users`. El mismo usuario
 * puede tener rol `admin` en una empresa y no tener acceso a otra, o tener roles
 * distintos en cada una (ver README para el ejemplo del contador vs. la veterinaria).
 *
 * Para sumar un rol nuevo (ej. "operario", "gerente"):
 *   1. Agregá el valor acá.
 *   2. Se sincroniza solo en el enum de Postgres (modules/users/infra/database/schema.ts
 *      lo deriva de acá).
 *   3. Corré `pnpm db:generate <nombre>` y `pnpm db:migrate`.
 *   4. Sumalo a los `RoleGroups` que corresponda (domain/role-groups.ts).
 *
 * String-enum (no numérico) para que sea legible en la DB.
 */
export enum Roles {
  ADMIN = "admin",
  CONTABLE = "contable",
  VETERINARIO = "veterinario",
  OPERARIO = "operario",
}
