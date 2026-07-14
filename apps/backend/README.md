# bioestancia-backend

Backend de administración de empresa del rubro porcino (granja, sanidad, producción y lo que se vaya sumando).

## Stack

- Node.js + TypeScript
- Express + Zod
- PostgreSQL + Drizzle ORM
- Inversify (Dependency Injection)
- JWT + bcrypt (auth)
- Pino (logger)
- Vitest (tests)

## Arquitectura

Hexagonal + DDD ligero. Cada módulo de dominio vive en `src/modules/<modulo>/` con tres capas:

- `domain/` — entidades, tipos e **interfaces** de repositorio.
- `use-cases/` — orquestación de la lógica de negocio.
- `infra/` — adaptadores concretos: HTTP (controller + validation), persistencia (schema + repository).

El código compartido entre módulos vive en `src/shared/infra/`.

## Auth, roles y permisos (módulo `users`)

Ya vienen implementados:

- **Signup / signin** con JWT (`bcrypt` para hashear passwords, token firmado con `JWT_SECRET`, vence en 7 días).
- **Roles**: por ahora solo existe `admin` (`src/modules/users/domain/roles.ts`). Es un enum — para sumar roles nuevos (ej. `veterinario`, `operario`, `gerente`) solo hay que agregar el valor ahí y en el enum de Postgres (`infra/database/schema.ts`), y generar la migración correspondiente.
- **Permisos por endpoint**: `ExpressAdapter.register()` acepta `roles: string[]` — la lista de roles permitidos para ese endpoint (ver `RoleGroups` en `domain/role-groups.ts`). Vacío o ausente = cualquier usuario autenticado.

Endpoints ya disponibles:

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/account/signup` | público | Crea un usuario (rol `admin` por ahora, único rol existente) |
| POST | `/api/account/users` | JWT + admin | Crea un usuario con rol específico |
| POST | `/api/account/signin` | público | Login, devuelve JWT |
| GET | `/api/account/me` | JWT | Datos del usuario autenticado |

## Setup

```bash
# 1. Instalar dependencias (desde la raíz del monorepo)
pnpm install

# 2. Crear archivo .env (copiar de .env.example) — parado en apps/backend
cp .env.example .env        # macOS/Linux
Copy-Item .env.example .env # Windows PowerShell

# 3. Levantar la base de datos en Docker
pnpm db

# 4. Aplicar migraciones
pnpm db:migrate

# 5. Correr en modo desarrollo
pnpm dev
```

> **Importante:** el `.env` tiene que existir en `apps/backend/.env` (no en la raíz del monorepo). Docker Compose lo lee desde ahí para las variables `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB`, y `Env` (`src/shared/infra/env/env.ts`) lo lee para el resto. Si al correr `pnpm db` ves warnings tipo `"POSTGRES_USER" variable is not set`, es que el archivo no está donde corresponde — verificá con `Get-Content apps/backend/.env` (o `cat`) que exista y tenga contenido.

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor en modo desarrollo con auto-reload |
| `pnpm build` | Compila TS a JS en `dist/` |
| `pnpm start` | Corre la build de producción |
| `pnpm typecheck` | Verifica tipos sin compilar |
| `pnpm test` | Corre los tests con Vitest |
| `pnpm db` | Levanta PostgreSQL en Docker |
| `pnpm db:stop` | Para PostgreSQL |
| `pnpm db:generate <name>` | Genera una migración nueva |
| `pnpm db:migrate` | Aplica las migraciones pendientes |

## Estructura

```
src/
├── shared/infra/      # DI, env, http, db, jwt, logger, auth
└── modules/
    └── users/          # auth + roles + permisos (único módulo por ahora)
        ├── domain/
        ├── use-cases/
        └── infra/
            ├── database/
            ├── repository/
            └── http/
```

## Cómo agregar el próximo módulo

Seguí la misma receta que `users` (13 pasos, documentados en detalle en el repo base Zonda Express):

1. `src/modules/<modulo>/domain/<entidad>.ts` — tipos del dominio.
2. `domain/<entidad>.repository.ts` — interface del repositorio.
3. `infra/database/schema.ts` — tabla Drizzle.
4. Re-exportar el schema en `src/shared/infra/database/schema.ts`.
5. `infra/repository/<entidad>.repository.ts` — implementación Drizzle.
6. `use-cases/*.use-case.ts` — uno por acción (create, get, list, update, delete).
7. `infra/http/validation.ts` — schemas Zod.
8. `infra/http/<entidad>.controller.ts` — registra rutas con `auth`/`roles`.
9. `<modulo>.module.ts` — registra todo en el container de Inversify.
10. Sumar los symbols nuevos en `src/shared/infra/di/types.ts`.
11. Conectar el módulo en `src/shared/infra/di/di.ts`.
12. `pnpm db:generate <nombre>` y `pnpm db:migrate`.
13. Probar con `pnpm dev` + curl/Postman.
