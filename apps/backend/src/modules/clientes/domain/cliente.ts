import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";

/**
 * Representación del Cliente en el dominio.
 *
 * Un cliente puede ser persona física (nombre + apellido + dni) o persona
 * jurídica (razonSocial + cuit) — por eso esos campos son todos opcionales acá.
 * La regla de negocio ("tiene que venir nombre+apellido O razonSocial, y cuit
 * O dni") se valida con Zod en infra/http/validation.ts (paso 5 de WORKFLOW.md),
 * no en el dominio: el dominio solo describe la forma de los datos, no las
 * reglas de qué combinación es válida.
 *
 * `listaDePreciosId` es nullable: un cliente puede no tener lista de precios
 * asignada todavía (referencia opcional a `listas_de_precios`, ver
 * infra/database/schema.ts).
 *
 * `esRevendedor` marca clientes que revenden lo que reciben y para los que
 * Bioestancia gestiona el reparto (caso real: "Ivan", revende media res de
 * Novillo). Habilita en el frontend la carga de reventa (`CategoriaReventa`,
 * ver `modules/ventas/domain/categoria-venta.ts`) y el catálogo de sus
 * destinos propios (`modules/clientes/domain/cliente-final.ts`) al cargar una
 * boleta. `false` por defecto: la gran mayoría de los clientes no revende.
 *
 * `diasPlazoPago`: cuántos días tiene este cliente para pagar una boleta
 * antes de que se considere vencida (cuenta corriente, ver
 * `modules/cuenta-corriente`). Nullable: si no está cargado se usa
 * `DIAS_PLAZO_PAGO_DEFAULT` (ver más abajo) — mismo patrón que
 * `Proveedor.porcentajeDesbaste`.
 *
 * `descuentoKgPorCabeza`: descuento fijo de kg que se le resta a este
 * cliente por cada cabeza de una boleta (ej. 0.8kg) — acuerdo comercial
 * puntual, no todos los clientes lo tienen. Nullable: `null` (o `0`) significa
 * que no se le aplica ningún descuento. Se usa para pre-cargar una línea de
 * "compensación de kg" negativa al armar la boleta (ver
 * `modules/boletas/components/boleta-form.tsx` en el frontend) — el operario
 * la puede editar o borrar ese día si hace falta, no se fuerza.
 *
 * `metaCabezasSemanales`: objetivo de cabezas que este cliente tiene que
 * comprar en una semana (lunes a domingo, semana ISO 8601 — ver
 * `shared/domain/semana-iso.ts`) para acceder a un descuento en el precio de
 * esa semana. Nullable: `null` = sin meta. NO se compensa entre semanas
 * (comprar de más una semana no suma para la siguiente, ver
 * `modules/metas-semanales/use-cases/obtener-progreso-metas-semanales.use-case.ts`)
 * y depende de que el cliente respete sus días de despacho planificados
 * (`modules/planificacion-cabezas`) — el cruce de cuánto lleva comprado esa
 * semana se calcula al vuelo a partir de `ventas`, no se guarda acá.
 * La aplicación del descuento en sí es MANUAL (herramienta "fijar precio en
 * lote" que ya existe) — este campo solo alimenta la alerta/barra de
 * progreso, no dispara nada solo.
 */
export interface Cliente {
  id: string;
  empresaId: string;
  listaDePreciosId: string | null;
  nombre: string | null;
  apellido: string | null;
  razonSocial: string | null;
  cuit: string | null;
  dni: string | null;
  domicilio: string | null;
  email: string | null;
  pais: string | null;
  provincia: string | null;
  ubicacion: string | null;
  condicionFiscal: CondicionFiscal;
  esRevendedor: boolean;
  diasPlazoPago: number | null;
  descuentoKgPorCabeza: number | null;
  metaCabezasSemanales: number | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Default cuando `Cliente.diasPlazoPago` es `null` — ver `Boleta.fechaVencimiento`. */
export const DIAS_PLAZO_PAGO_DEFAULT = 7;

/** Plazo efectivo de un cliente: el suyo si está cargado, si no el default. */
export function diasPlazoPagoEfectivo(cliente: Pick<Cliente, "diasPlazoPago">): number {
  return cliente.diasPlazoPago ?? DIAS_PLAZO_PAGO_DEFAULT;
}

/** Nombre para mostrar: razón social si es persona jurídica, nombre+apellido si es física. Espejo del frontend (`cliente.types.ts`). */
export function nombreCliente(cliente: Cliente): string {
  return cliente.razonSocial ?? [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");
}
