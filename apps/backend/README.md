# bioestancia-backend

Backend de administración de **dos empresas** del rubro porcino:

- **Bioestancia** — matadero/frigorífico.
- **El Meridiano** — revendedora de medias reses.

Cada empresa lleva su propia contabilidad (no hay operaciones intercompany: si
Bioestancia le factura un servicio de faena a El Meridiano, es una venta normal
para una y un gasto normal para la otra — ver "Modelo multi-empresa" abajo).

## Stack

- Node.js + TypeScript
- Express + Zod
- PostgreSQL + Drizzle ORM
- Inversify (Dependency Injection)
- JWT + bcrypt (auth)
- Pino (logger)
- Vitest (tests)
- OpenAPI/Swagger (`@asteasolutions/zod-to-openapi` + `swagger-ui-express`) — documentación interactiva de la API

## Arquitectura

Hexagonal + DDD ligero. Cada módulo de dominio vive en `src/modules/<modulo>/` con tres capas:

- `domain/` — entidades, tipos e **interfaces** de repositorio.
- `use-cases/` — orquestación de la lógica de negocio.
- `infra/` — adaptadores concretos: HTTP (controller + validation), persistencia (schema + repository).

El código compartido entre módulos vive en `src/shared/infra/`.

## Modelo multi-empresa

Todo el sistema es **shared database, shared schema**: una sola base de datos,
con `empresa_id` como columna en cada tabla de negocio. No hay bases ni schemas
de Postgres separados por empresa — con dos empresas conocidas, eso sería
sobre-ingeniería.

- **`empresas`** (`src/modules/empresas/`): tabla maestra. Hoy tiene dos filas
  (Bioestancia, El Meridiano), pero el modelo no está atado a ese número.
- **`usuario_empresas`** (`src/modules/users/domain/usuario-empresa.ts`): tabla
  puente usuario↔empresa, con el **rol relativo a esa empresa**. Un usuario
  puede tener acceso a una empresa, a las dos, o a ninguna — y el rol puede
  diferir en cada una (ej. el contador es `contable` en ambas; la veterinaria
  es `veterinario` solo en Bioestancia).
- **El rol NO vive en `users`** — vive en `usuario_empresas`. La tabla `users`
  solo tiene datos de autenticación (email, password, nombre).

### Cómo viaja la empresa activa en cada request

1. El JWT es liviano: solo lleva el `id` del usuario, nada de rol ni empresa.
   Así, si le sacás el acceso a alguien a una empresa, el cambio aplica al
   toque — no hay que esperar a que expire un token de 7 días.
2. El frontend manda la empresa que el usuario eligió operar en el header
   **`X-Empresa-Id`** en cada request a un endpoint de negocio.
3. El middleware de auth (`shared/infra/http/http-server.ts`) valida ese header
   contra `usuario_empresas` en cada request — **nunca se confía a ciegas**.
   Si el usuario no tiene fila para esa empresa, 403. Si la tiene, de ahí sale
   el rol usado para el chequeo de `roles: [...]`.

### Tipos de auth en `ExpressAdapter.register()`

| `auth` | Requiere | Uso |
|---|---|---|
| `"public"` | nada | signup, signin |
| `"jwt"` | JWT válido | endpoints que no dependen de una empresa puntual (`/account/me`, `/account/empresas`) |
| `"jwt-empresa"` | JWT válido + header `X-Empresa-Id` con acceso | todo endpoint de negocio (ventas, gastos, faena, etc.) |

`roles: RoleGroups.AdminOnly` (u otro grupo) solo tiene efecto con `"jwt-empresa"` — el rol se resuelve sobre la empresa activa.

## Documentación de la API (Swagger/OpenAPI)

Con el server corriendo (`pnpm dev`), la documentación interactiva está en:

- **http://localhost:3000/api/docs** — Swagger UI (probar endpoints desde el navegador, con el candadito de auth para pegar el JWT).
- **http://localhost:3000/api/docs.json** — el documento OpenAPI 3.0 crudo (sirve para "Import from URL" en Postman/Insomnia).

Se genera automáticamente a partir de los mismos schemas Zod de cada `infra/http/validation.ts` — no hay que mantenerla a mano. Cuando agregues un módulo nuevo, sumá su `<modulo>.openapi.ts` (ver `modules/users/infra/http/user.openapi.ts` como referencia) y registralo en `shared/infra/openapi/generate-document.ts`.

## Auth, roles y permisos (módulo `users`)

Ya vienen implementados:

- **Signup**: crea el usuario SIN acceso a ninguna empresa. El acceso se otorga aparte.
- **Signin**: devuelve el JWT + la lista de empresas a las que el usuario tiene acceso (con su rol en cada una) — el frontend usa esto para armar el selector de empresa (o auto-seleccionar si solo hay una).
- **Roles** (`src/modules/users/domain/roles.ts`): `admin`, `contable`, `veterinario`. Para sumar uno nuevo (ej. `operario`, `gerente`): agregalo al enum, corré `pnpm db:generate <nombre>` y `pnpm db:migrate`, y sumalo a los `RoleGroups` que corresponda.
- **Permisos por endpoint**: `ExpressAdapter.register()` acepta `roles: string[]` (ver `RoleGroups` en `domain/role-groups.ts`). Vacío o ausente = cualquier usuario con acceso a la empresa activa.

Endpoints ya disponibles:

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/account/signup` | público | Crea un usuario, sin acceso a ninguna empresa |
| POST | `/api/account/signin` | público | Login, devuelve JWT + empresas a las que tiene acceso |
| GET | `/api/account/me` | JWT | Datos del usuario autenticado |
| GET | `/api/account/empresas` | JWT | Empresas a las que tiene acceso + rol en cada una (para el selector) |
| POST | `/api/account/users` | JWT + empresa + admin | Crea un usuario nuevo Y le otorga acceso a la empresa activa con un rol |
| POST | `/api/account/access` | JWT + empresa + admin | Otorga acceso a la empresa activa a un usuario que YA existe (por email) |
| POST | `/api/empresas` | JWT + empresa + admin | Crea una empresa nueva (uso administrativo/bootstrap) |
| GET | `/api/empresas` | JWT + empresa + admin | Lista todas las empresas del sistema |

## Listas de precios (módulo `listas-precios`)

Solo el encabezado por ahora (nombre, descripción, activa) — los ítems con precio por producto van a necesitar un módulo de catálogo/productos que todavía no existe.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/listas-precios` | JWT + empresa + admin/contable | Crea una lista de precios para la empresa activa |
| GET | `/api/listas-precios` | JWT + empresa | Lista las listas de precios activas de la empresa activa |
| GET | `/api/listas-precios/:id` | JWT + empresa | Obtiene una lista de precios por id |

## Clientes (módulo `clientes`)

Un cliente es persona física (`nombre` + `apellido` + `dni`) o persona jurídica (`razonSocial` + `cuit`) — nunca los dos juegos de campos obligatorios a la vez. Esa regla se valida con Zod (`infra/http/validation.ts`), no en el dominio ni en la DB (ahí todos esos campos son nullable).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/clientes` | JWT + empresa + admin/contable | Crea un cliente para la empresa activa |
| GET | `/api/clientes` | JWT + empresa | Lista los clientes de la empresa activa |
| GET | `/api/clientes/:id` | JWT + empresa | Obtiene un cliente por id |

## Proveedores (módulo `proveedores`)

Misma base que `clientes`: persona física (`nombre` + `apellido` + `dni`) o jurídica (`razonSocial` + `cuit`), validado con Zod. Suma `datosBancarios` (CBU o CVU, 22 dígitos numéricos) para pagos. No tiene `listaDePreciosId` (eso es específico de clientes).

`porcentajeDesbaste`: % de desbaste negociado con este proveedor (cuando es un criadero), nullable. Se usa como default al cargar una compra (ver `compras` abajo) — se puede pisar puntualmente por compra.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/proveedores` | JWT + empresa + admin/contable | Crea un proveedor para la empresa activa |
| GET | `/api/proveedores` | JWT + empresa | Lista los proveedores de la empresa activa |
| GET | `/api/proveedores/:id` | JWT + empresa | Obtiene un proveedor por id |

## Compras (módulo `compras`)

Una compra es la compra de un lote de animales a un proveedor (criadero), identificada con un número que asignamos nosotros — no el proveedor. Se llamó "tropa" en la primera versión; se renombró a `compras` para poder sumar otras especies a futuro sin reestructurar (ver `especie` abajo) y para poder reportar compras por día/semana/mes independientemente del lote.

`numero` es el código de lote tal cual lo manejan hoy (ej. `"193-BIO"`), sin forzar formato ni unicidad global (no hay garantía de que no se repita entre años). Cada compra tiene un `dte` y un `remito` de referencia (uno de cada, los documentos que emiten SENASA y el proveedor).

`especie` es un enum (`porcino` | `bovino` | `otro`, default `porcino`) pensado para poder sumar bovino u otra especie más adelante agregando un valor al enum (`ALTER TYPE ... ADD VALUE`), sin tocar la estructura de la tabla.

`letra` es un código alfabético opcional (ej. `"D"`) que se le muestra al cliente en la boleta en vez del número real de la compra — así no piensa que es una tropa vieja. Rota con el tiempo: es un campo simple sobre la compra, no una tabla de mapeo aparte.

**La compra NO tiene `cantidadAnimales`/`pesoBruto`/`pesoNeto` como campos propios.** El remito/DTE real ya viene separado por categoría/raza (ej. "30 machos + 90 hembras", o "36 Capón / 124 Macho Entero Inmunocastrado") — no es un total único. Esos datos viven en `compra_categorias`, una línea por categoría, con `cabezas`, `pesoBruto` (kg vivo de báscula) y `pesoNeto` (calculado: `pesoBruto × (1 - porcentajeDesbaste / 100)`, con el `porcentajeDesbaste` de la compra aplicado parejo a todas sus líneas). Al crear una compra se manda `categorias: [...]` con al menos una línea.

Cada línea de `compra_categorias` se va completando en 3 momentos del negocio, siempre sobre la MISMA categoría/raza (una compra se faena entera, 1 a 1 — no se combinan ni se dividen):

1. **Al comprar**: `categoria`, `raza`, `cabezas`, `pesoBruto`, `pesoNeto`.
2. **Al cargar el resultado de faena** (ver módulo `resultado-faena` abajo): `kgVivoFaena`, `kgCarne`, `porcentajeMagro`, `destinoComercial`, `cuartosDelantero`, `cuartosTrasero`.
3. **Al emitir la liquidación de compra** (ver módulo `liquidacion-compra` abajo): `precioKg`, `importeBruto`, `porcentajeIva`, `importeIva`.

**Cierre de compra** (`POST /api/compras/:id/cerrar`): reconcilia la compra contra las ventas. Cuenta los garrones **distintos** vendidos en `ventas` para esa compra (no filas — cada garrón tiene 2 medias reses, pueden venderse por separado en 2 filas) y los compara contra la **suma de `cabezas`** de sus `compra_categorias`. Si no coinciden exacto, el cierre se bloquea (400) — no hay forma de cerrar "con diferencia" en esta versión. Si coinciden, calcula `pesoFinalVenta` (suma de kg vendidos) y `rinde = pesoFinalVenta / (suma de pesoNeto) × 100`, y marca `cerrada = true`.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/compras` | JWT + empresa + admin/contable | Crea una compra con sus líneas de categoría para la empresa activa |
| GET | `/api/compras` | JWT + empresa | Lista las compras de la empresa activa (sin el detalle de categorías) |
| GET | `/api/compras/:id` | JWT + empresa | Obtiene una compra por id, con sus líneas de categoría |
| POST | `/api/compras/:id/cerrar` | JWT + empresa + admin/contable | Cierra la compra: reconcilia cabezas y calcula rinde |

## Resultado de faena (módulo `resultado-faena`)

Cuando los animales de una compra se faenan, el frigorífico entrega un documento oficial (formato SENASA) con el kg vivo verificado en planta y el kg de carne obtenido, desglosado por categoría/raza. Es 1 a 1 con una compra (`compraId` único) — una compra siempre se faena entera, de una sola vez.

Al cargarlo, se manda el header (`fechaFaena`, `numero`, `numeroAutorizacion`, `comisosKg`, `comisosCabezas`, `comentarios`) más `categorias: [{ compraCategoriaId, kgVivoFaena, kgCarne, porcentajeMagro, destinoComercial, cuartosDelantero, cuartosTrasero }]`. El server valida que cada `compraCategoriaId` pertenezca a la compra, completa esos campos en la línea de `compra_categorias` correspondiente, y calcula `kgVivoTotal`/`kgCarneTotal` (suma de las líneas) y `rendimiento = kgCarneTotal / kgVivoTotal × 100` — este `rendimiento` es un dato que da el FRIGORÍFICO (cuánta carne salió del kg vivo), distinto del `rinde` de `compras` (que compara lo vendido contra lo comprado neto).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/compras/:compraId/resultado-faena` | JWT + empresa + admin/contable | Carga el resultado de faena de una compra |
| GET | `/api/compras/:compraId/resultado-faena` | JWT + empresa | Obtiene el resultado de faena de una compra, con sus categorías |

## Liquidación de compra (módulo `liquidacion-compra`)

Una vez que se conoce el resultado de faena, El Meridiano emite la liquidación de compra: el comprobante fiscal (AFIP/ARCA) que se le manda al criadero con el precio, la raza/categoría y la cantidad de cabezas. Es 1 a 1 con una compra, y requiere que esa compra ya tenga un `resultado-faena` cargado — se factura sobre el `kgVivoFaena` de cada línea (el kg vivo verificado en planta), no sobre el `pesoBruto` de compra.

Al cargarla, se manda el header (`numeroComprobante`, `fecha`, `fechaOperacion`, `cae`, `fechaVencimientoCae`, `totalGastos`, `ivaSobreGastos`, `totalTributos`, `comentarios`) más `categorias: [{ compraCategoriaId, precioKg, porcentajeIva }]`. El server calcula, por línea, `importeBruto = kgVivoFaena × precioKg` e `importeIva = importeBruto × porcentajeIva / 100`, los guarda en `compra_categorias`, y arma los totales del header (`importeBruto`, `ivaSobreBruto`, `importeNeto`) sumando las líneas más gastos/tributos adicionales. Si alguna categoría todavía no tiene `kgVivoFaena` cargado, falla con 400.

Hoy esto se carga a mano con los datos que ya salen del comprobante emitido en AFIP. `numeroComprobante`/`cae`/`fechaVencimientoCae` quedan como referencia — el día que haya integración directa con la API de ARCA, esos campos se completarían solos.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/compras/:compraId/liquidacion` | JWT + empresa + admin/contable | Emite la liquidación de una compra |
| GET | `/api/compras/:compraId/liquidacion` | JWT + empresa | Obtiene la liquidación de una compra, con sus categorías |

## Boletas (módulo `boletas`)

Una boleta es el comprobante físico que se le entrega a un cliente por lo vendido en el día — es una entidad propia (no un reporte armado a partir de `ventas`) porque tiene su propio número impreso que hay que guardar tal cual, y porque a futuro puede sumar el escaneo/foto del documento físico, que vive una sola vez por boleta y no una vez por línea de venta.

Encabezado: `clienteId`, `fecha`, `numero` (el número impreso en el papel, opcional), `comentarios`. Cada línea de `ventas` puede referenciar una boleta vía `boletaId` (nullable, para no romper ventas cargadas sin boleta).

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/boletas` | JWT + empresa + admin/contable | Crea una boleta para la empresa activa |
| GET | `/api/boletas` | JWT + empresa | Lista las boletas de la empresa activa |
| GET | `/api/boletas/:id` | JWT + empresa | Obtiene una boleta por id |

## Ventas (módulo `ventas`)

Cada fila es **una venta de un garrón** (cabeza entera, media res, o un corte como pulpa) o un ajuste de compensación — no un lote. `formaVenta` es un enum (`cabeza_capon`, `cabeza_chancha`, `media_res_capon`, `pulpa`, `compensacion_kg`). `total` se calcula en el servidor (`kg × precioKg`), nunca se toma del body.

`compraId` + `garron` son nullable: las filas de `compensacion_kg` son ajustes sin animal físico asociado. Cuando sí hay animal, la regla de negocio (Zod) exige los dos juntos. El `garron` (caravana del animal) **puede repetirse** para una misma compra: cada garrón tiene 2 medias reses, y se pueden vender por separado a dos clientes distintos (dos filas con el mismo `compraId`+`garron`). Por eso NO hay `UNIQUE(compraId, garron)` — la reconciliación de cabezas vendidas (al cerrar una compra, ver módulo `compras`) cuenta garrones distintos, no filas.

`boletaId` es nullable: referencia la boleta física (ver módulo `boletas`) en la que se cargó esta línea, cuando corresponde.

`clienteFinalReferencia` es un campo libre, no una relación: cubre el caso de clientes que revenden (ej. un cliente que le vende a otro cliente final) — queda anotado solo como referencia de la boleta, sin crear un cliente ni una venta nueva.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/ventas` | JWT + empresa + admin/contable | Crea una venta para la empresa activa |
| GET | `/api/ventas` | JWT + empresa | Lista las ventas de la empresa activa |
| GET | `/api/ventas/:id` | JWT + empresa | Obtiene una venta por id |

## Planificación de cabezas (módulo `planificacion-cabezas`)

Planifica cuántas cabezas se le van a vender a cada cliente, **día por día** (no un total semanal) — así se puede armar la semana completa cargando lunes, martes, etc. por separado.

Es **independiente de `compras`**: no reserva animales de ninguna tropa puntual. Es al revés — la planificación de lo que los clientes van a comprar es lo que informa cuántos animales conviene comprar en las próximas tropas, no al revés. Por eso no tiene `compraId`.

La carga (`POST /api/planificacion-cabezas`) es un **upsert** por `(clienteId, fecha)`: se manda `clienteId` + `dias: [{ fecha, cabezasPlanificadas, comentarios }]`, y si ya había un plan cargado para ese cliente en ese día, lo actualiza en vez de duplicarlo — el plan de la semana se revisa seguido.

La lectura (`GET /api/planificacion-cabezas?desde=...&hasta=...&clienteId=...`) devuelve, para cada día planificado en el rango, `cabezasPlanificadas` **cruzado contra `cabezasVendidas`** (garrones distintos vendidos ese día a ese cliente, mismo criterio que la reconciliación de `compras`: no cuenta filas, cuenta garrones, y no incluye ajustes de `compensacion_kg`). `clienteId` es opcional — sin él, trae el plan de todos los clientes en ese rango (la vista típica: toda la semana, todos los clientes). El cruce contra ventas solo se calcula para los clientes que tienen al menos un día planificado en el rango.

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/planificacion-cabezas` | JWT + empresa + admin/contable | Guarda o revisa el plan de uno o varios días de un cliente |
| GET | `/api/planificacion-cabezas` | JWT + empresa | Lista el plan en un rango de fechas, cruzado contra lo vendido |

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

# 5. Bootstrap inicial: crea Bioestancia + El Meridiano, y (opcional) un admin
#    con acceso a ambas. Sin las variables SEED_ADMIN_*, solo crea las empresas.
SEED_ADMIN_EMAIL=vos@bioestancia.com SEED_ADMIN_PASSWORD=algo-seguro pnpm db:seed

# 6. Correr en modo desarrollo
pnpm dev
```

> **¿Por qué hace falta el seed?** Los endpoints que crean empresas/usuarios/accesos requieren un admin existente (`RoleGroups.AdminOnly`, resuelto sobre la empresa activa). Sin este script no hay forma de arrancar el sistema desde cero. Es idempotente: correrlo de nuevo no duplica empresas ni usuarios.

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
| `pnpm db:seed` | Bootstrap: crea Bioestancia + El Meridiano (+ admin si seteás `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) |

## Estructura

```
src/
├── shared/infra/      # DI, env, http (incluye el middleware multi-empresa), db, jwt, logger, auth
│   └── database/
│       └── seed.ts    # bootstrap: empresas + admin inicial
└── modules/
    ├── empresas/       # tabla maestra de empresas
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── users/          # auth + usuario_empresas (acceso y rol por empresa)
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    │       ├── database/
    │       ├── repository/
    │       └── http/
    ├── listas-precios/ # encabezado de listas de precios (sin ítems todavía)
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── clientes/       # persona física o jurídica, por empresa
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── proveedores/    # misma base que clientes + datosBancarios (CBU/CVU)
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── compras/        # compra de un lote a un proveedor; especie + letra + compra_categorias
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── resultado-faena/ # resultado de faena del frigorífico, 1 a 1 con compras
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── liquidacion-compra/ # comprobante AFIP que se le manda al criadero, 1 a 1 con compras
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── boletas/        # comprobante físico por cliente/día (El Meridiano)
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    ├── ventas/         # línea de venta = 1 cabeza, referencia cliente + compra + boleta
    │   ├── domain/
    │   ├── use-cases/
    │   └── infra/
    └── planificacion-cabezas/ # plan de cabezas por cliente y día, cruzado contra ventas
        ├── domain/
        ├── use-cases/
        └── infra/
```

## Cómo agregar el próximo módulo (ej. `planificacion-semanal`, `pagos`, `sanidad`)

Ver [`WORKFLOW.md`](../../WORKFLOW.md) en la raíz del monorepo para la receta completa paso a paso.

Un solo punto extra respecto a la receta genérica: **toda tabla de negocio lleva
`empresaId`** (referencia a `empresas.id`), y el repositorio siempre filtra por
el `empresaId` que resolvió el middleware de auth (`auth.empresaId` en el
handler) — nunca por uno que venga en el body/params del request. Esto es lo
que garantiza que la veterinaria no pueda ver datos de El Meridiano ni por
error de frontend.
