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
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
