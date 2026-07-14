# Bioestancia App

Monorepo del sistema Bioestancia — administración de empresa del rubro porcino (granja, sanidad, producción, etc.).

Base tomada de la arquitectura de [Zonda Express](https://github.com/JhonGuu/ZondaExpress): mismo stack y misma organización hexagonal, adaptada al dominio porcino.

## Estructura

```
bioestancia_app/
├── apps/
│   ├── backend/    # API REST: Node + Express + Drizzle + PostgreSQL
│   └── frontend/   # (a futuro) SPA
├── packages/       # (futuro) packages compartidos entre apps
├── pnpm-workspace.yaml
└── package.json
```

## Setup

```bash
# 1. Instalar dependencias de TODO el monorepo
pnpm install

# 2. Levantar la DB (Docker Desktop tiene que estar corriendo)
pnpm --filter backend db

# 3. Aplicar migraciones
pnpm --filter backend db:migrate

# 4. Levantar el backend
pnpm dev:backend
```

## Scripts del root

| Comando | Descripción |
|---|---|
| `pnpm dev` | Backend (+ frontend cuando exista) en paralelo |
| `pnpm dev:backend` | Solo backend |
| `pnpm build` | Compila apps |
| `pnpm typecheck` | Verifica tipos |
| `pnpm test` | Corre tests |

## Documentación por app

- [Backend](./apps/backend/README.md) — arquitectura hexagonal, módulos, migraciones, auth/roles.
