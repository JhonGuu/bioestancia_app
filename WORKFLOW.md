# Flujo de trabajo — Agregar un módulo nuevo

Guía paso a paso para sumar módulos de dominio (ventas, gastos, sanidad, faena, stock, etc.) al backend de Bioestancia sin romper la arquitectura hexagonal ni el modelo multi-empresa existentes. Usá `users` (`apps/backend/src/modules/users/`) y `empresas` (`apps/backend/src/modules/empresas/`) como referencia viva de cada paso.

No define todavía qué módulos de negocio vienen — esto es el proceso técnico a repetir cada vez que arranques uno nuevo.

## 0. Antes de escribir código

- [ ] Definí el nombre del módulo en singular y en español consistente con el resto (`venta`, no `ventas` para la entidad — el módulo/carpeta sí va en plural: `modules/ventas/`).
- [ ] Escribí en una línea qué entidad(es) maneja y qué acciones necesita (create, list, get, update, delete, o algo custom).
- [ ] Confirmá si la tabla es **de negocio** (necesita `empresaId`, casi todo lo que no sea `users`/`empresas`) o **verdaderamente global** (catálogos compartidos entre las dos empresas, como unidades de medida). Ante la duda, llevá `empresaId` — sacarlo después es más fácil que agregarlo.
- [ ] Creá una branch: `git checkout -b feature/<modulo>`.

## 1. Domain — entidades y contrato del repositorio

```
src/modules/<modulo>/domain/<entidad>.ts
src/modules/<modulo>/domain/<entidad>.repository.ts
```

- El `.ts` de la entidad define el tipo TypeScript puro, sin dependencias de Drizzle ni de Express. Si es una tabla de negocio, incluí `empresaId: string`.
- El `.repository.ts` define la **interface** con los métodos que el use-case va a necesitar. Todo método que lea/escriba filas de negocio recibe `empresaId` como parámetro **obligatorio** (nunca opcional) — es lo que impide que una empresa vea datos de la otra. Nada de implementación acá — eso va en `infra/`.

## 2. Infra — schema de base de datos

```
src/modules/<modulo>/infra/database/schema.ts
```

- Tabla Drizzle para la entidad. Si es de negocio, sumá:
  ```ts
  empresaId: uuid("empresa_id").notNull().references(() => empresas.id, { onDelete: "cascade" }),
  ```
  importando `empresas` desde `@/modules/empresas/infra/database/schema`.
- Re-exportar el schema nuevo en `src/shared/infra/database/schema.ts` (el archivo central que Drizzle Kit lee para generar migraciones).

## 3. Infra — repositorio concreto

```
src/modules/<modulo>/infra/repository/<entidad>.repository.ts
```

Implementación de la interface del paso 1 usando Drizzle sobre el schema del paso 2. Todo `WHERE` de una tabla de negocio incluye `eq(tabla.empresaId, empresaId)`.

## 4. Use-cases

```
src/modules/<modulo>/use-cases/<accion>.use-case.ts
```

Un archivo por acción (`create-<entidad>.use-case.ts`, `list-<entidad>.use-case.ts`, etc.). Reciben `empresaId` en su input y lo pasan al repositorio — nunca lo derivan de otro lado.

## 5. Infra — HTTP

```
src/modules/<modulo>/infra/http/validation.ts       # schemas Zod (body/params/query)
src/modules/<modulo>/infra/http/<entidad>.controller.ts
src/modules/<modulo>/infra/http/<entidad>.openapi.ts  # documentación Swagger (reusa los schemas de validation.ts)
```

El controller registra las rutas con `ExpressAdapter.register()`:

- `auth: "jwt-empresa"` para cualquier endpoint de negocio (requiere header `X-Empresa-Id` validado contra `usuario_empresas`).
- `roles: RoleGroups.AlgoOnly` según quién puede pegarle a cada endpoint (ver `RoleGroups` en `modules/users/domain/role-groups.ts`).
- El handler usa `auth.empresaId` (viene resuelto y validado por el middleware) para pasárselo al use-case — **nunca** un `empresaId` que venga en `body`/`params`/`query`.

El `<entidad>.openapi.ts` registra cada endpoint en el `OpenAPIRegistry` compartido (ver `modules/users/infra/http/user.openapi.ts` de ejemplo) reusando los mismos schemas Zod de `validation.ts` — no dupliques los schemas de request. Sumá su `register<Modulo>OpenApi()` en `shared/infra/openapi/generate-document.ts` para que aparezca en `/api/docs`.

## 6. Módulo — ensamblado

```
src/modules/<modulo>/<modulo>.module.ts
```

Registra entidad, repositorio, use-cases y controller en el container de Inversify.

## 7. Dependency Injection — conectar al resto

- [ ] Sumar los symbols nuevos en `src/shared/infra/di/types.ts`.
- [ ] Conectar el módulo en `src/shared/infra/di/di.ts`.

## 8. Migración de base de datos

```bash
pnpm db:generate <nombre-descriptivo>
pnpm db:migrate
```

Revisá el SQL generado en `src/shared/infra/database/migrations/` antes de aplicarlo — Drizzle a veces necesita que confirmes si una columna es nueva o un rename.

## 9. Probar

- [ ] `pnpm dev` levanta sin errores de tipos ni de DI (Inversify falla en runtime si falta un binding).
- [ ] Probar cada endpoint con curl/Postman/Thunder Client, mandando el header `X-Empresa-Id`: caso feliz + al menos un caso de error (validación Zod, rol sin permiso, empresa sin acceso, recurso inexistente).
- [ ] Probar explícitamente que un usuario con acceso solo a la Empresa A no puede leer/escribir datos de la Empresa B (mandar el `X-Empresa-Id` de B con su token — tiene que dar 403).
- [ ] `pnpm typecheck` limpio.
- [ ] Si el módulo tiene lógica de negocio no trivial en los use-cases, sumá tests con Vitest (`pnpm test`).

## 10. Cerrar

- [ ] Actualizar la tabla de endpoints en `apps/backend/README.md` si agregaste rutas nuevas.
- [ ] Commit con mensaje descriptivo (`feat(<modulo>): CRUD básico + auth`), push, PR contra `main`.

---

## Checklist resumida (para copiar en cada módulo nuevo)

```
- [ ] domain/<entidad>.ts (con empresaId si es de negocio)
- [ ] domain/<entidad>.repository.ts (empresaId obligatorio en cada método)
- [ ] infra/database/schema.ts (empresaId + FK a empresas; + re-export en shared/infra/database/schema.ts)
- [ ] infra/repository/<entidad>.repository.ts (WHERE siempre filtra por empresaId)
- [ ] use-cases/*.use-case.ts
- [ ] infra/http/validation.ts
- [ ] infra/http/<entidad>.controller.ts (auth: "jwt-empresa", usa auth.empresaId)
- [ ] infra/http/<entidad>.openapi.ts (+ registrarlo en shared/infra/openapi/generate-document.ts)
- [ ] <modulo>.module.ts
- [ ] shared/infra/di/types.ts
- [ ] shared/infra/di/di.ts
- [ ] pnpm db:generate + pnpm db:migrate
- [ ] pnpm dev + pruebas manuales (incluyendo probar que NO se filtre entre empresas)
- [ ] pnpm typecheck
- [ ] README actualizado + commit/PR
```

## Convenciones

- **Branches:** `feature/<modulo>`, `fix/<algo>`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat(sanidad): ...`, `fix(users): ...`).
- **Un módulo por PR** cuando sea posible — más fácil de revisar y de revertir si algo sale mal en producción.
- **No saltear el paso 2 (interface de repositorio)** aunque parezca burocrático: es lo que permite testear use-cases sin levantar Postgres.
- **`empresaId` siempre explícito**, nunca implícito: se recibe del `auth` resuelto por el middleware, se pasa por parámetro en cada capa, y se usa en cada query. Nunca se infiere de una sesión global ni de datos del body.

## Referencia

- Arquitectura completa, stack, modelo multi-empresa y endpoints de `users`/`empresas`: [`apps/backend/README.md`](./apps/backend/README.md).
- Modelo de datos multi-empresa (por qué `empresa_id` en vez de bases separadas, cómo se resuelve el rol por request): sección "Modelo multi-empresa" del README de arriba.
