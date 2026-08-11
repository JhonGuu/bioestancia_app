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
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Nombre para mostrar: razón social si es persona jurídica, nombre+apellido si es física. Espejo del frontend (`cliente.types.ts`). */
export function nombreCliente(cliente: Cliente): string {
  return cliente.razonSocial ?? [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");
}
