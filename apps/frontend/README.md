# bioestancia-frontend

Frontend de administración de **Bioestancia** (frigorífico) y **El Meridiano**
(revendedora), consumiendo la API de `apps/backend`.

## Stack

- React 19 + TypeScript + Vite
- [TanStack Router](https://tanstack.com/router) (file-based routing, con contexto de auth)
- [TanStack Query](https://tanstack.com/query) (estado de servidor, cache, invalidación)
- Axios (cliente HTTP, con interceptors de auth)
- Zod (validación de forms, espejo de los schemas del backend)
- React Hook Form (`@hookform/resolvers/zod`)
- Tailwind CSS v4 + shadcn/ui (componentes propios en `src/components/ui`, sin dependencia del CLI)

## Arquitectura

Misma filosofía que el backend (ver `apps/backend/README.md`): cada módulo de
negocio vive en `src/modules/<modulo>/` con capas separadas:

- `domain/` — tipos (espejo de `apps/backend/.../domain/*.ts`) y schemas Zod de forms.
- `api/` — la única capa que sabe las URLs y el shape crudo de la API (equivalente a "infra" del backend).
- `hooks/` — TanStack Query (`useQuery`/`useMutation`) sobre la capa `api/`. Es el "use-case" del lado del cliente.
- `components/` — UI específica del módulo (tablas, forms).

```
src/
├── routes/                  # TanStack Router (file-based). Ver mapeo abajo.
├── shared/
│   ├── config/env.ts        # Variables de entorno (Zod)
│   ├── api/http-client.ts   # Instancia de Axios + interceptors (JWT, X-Empresa-Id)
│   ├── api/api-response.ts  # ApiError, tipos de respuesta del backend
│   ├── auth/                # session-storage (localStorage) + auth-events (pub-sub para 401)
│   └── components/app-shell.tsx
├── components/ui/           # shadcn/ui (button, input, form, table, select, dialog, etc.)
├── lib/utils.ts             # cn()
└── modules/
    ├── auth/                # login, sesión, selector de empresa
    │   ├── domain/           # User, EmpresaAcceso, Roles, Rubro
    │   ├── api/auth.api.ts
    │   └── context/auth-context.tsx   # AuthProvider + useAuth()
    └── clientes/             # módulo de referencia (CRUD completo: alta + listado)
        ├── domain/
        ├── api/
        ├── hooks/
        └── components/
```

### Rutas

| Ruta | Guard | Descripción |
|---|---|---|
| `/` | — | Nunca renderiza: redirige según el estado de sesión |
| `/login` | solo si NO hay sesión | Login |
| `/empresas` | requiere sesión | Selector de empresa (se salta si el usuario solo tiene acceso a una) |
| `/app` | requiere sesión + empresa activa | Shell (topbar + nav) |
| `/app/clientes` | ídem | Listado de clientes |
| `/app/clientes/nuevo` | ídem | Alta de cliente |

Para sumar un módulo nuevo (ej. `proveedores`, `compras`): repetí la carpeta
`modules/clientes/*` como plantilla y agregá las rutas bajo
`src/routes/_authenticated/app/<modulo>/`.

### Auth y empresa activa

Igual que espera el backend (ver su README, sección "Cómo viaja la empresa
activa en cada request"):

1. `POST /account/signin` devuelve un JWT + las empresas a las que el usuario
   tiene acceso. El JWT se guarda en `localStorage` y se manda como
   `Authorization: Bearer <token>` en cada request (`shared/api/http-client.ts`).
2. La empresa elegida se guarda aparte y se manda en el header `X-Empresa-Id`
   en cada request — el backend la valida contra `usuario_empresas` en cada
   llamada, así que nunca hay que "refrescar" nada al cambiar de empresa.
3. Un 401 del backend limpia la sesión automáticamente (interceptor de Axios +
   evento `AuthEvents` que escucha `AuthProvider`) y manda al login.

## Setup

```bash
cd apps/frontend
npm install
cp .env.example .env   # y apuntá VITE_API_URL a tu backend local
npm run dev
```

Necesita el backend (`apps/backend`) corriendo y al menos un usuario con
acceso a una empresa (ver el `pnpm db:seed` del backend).

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Typecheck (`tsc -b`) + build de producción |
| `npm run typecheck` | Solo typecheck, sin compilar |
| `npm run lint` | oxlint |
| `npm run preview` | Sirve el build de `dist/` |

## Nota sobre el gestor de paquetes

El backend usa `pnpm` (workspace del monorepo). Este frontend se armó y se
verificó con `npm` porque el entorno en el que lo generé no tenía `pnpm`
disponible — funciona perfecto así, pero si preferís que todo el monorepo use
el mismo gestor: borrá `package-lock.json`, corré `pnpm install` acá adentro,
y sumá `apps/*` a un `pnpm-workspace.yaml` en la raíz si todavía no lo tenés.

## Pendiente para las próximas iteraciones

- Módulos que faltan calcar del backend: `proveedores`, `compras` (+
  `resultado-faena`, `liquidacion-compra`), `boletas`, `ventas`,
  `planificacion-cabezas`, `listas-precios`.
- Permisos por rol en la UI (ocultar/deshabilitar acciones según
  `empresaActiva.rol`, espejo de `RoleGroups` del backend) — hoy el backend ya
  lo enforce, pero el frontend no oculta nada todavía.
- Paginación/búsqueda en los listados (hoy `GET /clientes` trae todo).
