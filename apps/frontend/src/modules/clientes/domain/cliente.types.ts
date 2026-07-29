/**
 * Espejo de `apps/backend/src/modules/clientes/domain/*`.
 */

/**
 * Ver `apps/backend/src/modules/clientes/domain/condicion-fiscal.ts`.
 * Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 */
export const CondicionFiscal = {
  RESPONSABLE_INSCRIPTO: "responsable_inscripto",
  MONOTRIBUTO: "monotributo",
  CONSUMIDOR_FINAL: "consumidor_final",
  EXENTO: "exento",
} as const;
export type CondicionFiscal = (typeof CondicionFiscal)[keyof typeof CondicionFiscal];

export const CONDICION_FISCAL_LABELS: Record<CondicionFiscal, string> = {
  [CondicionFiscal.RESPONSABLE_INSCRIPTO]: "Responsable inscripto",
  [CondicionFiscal.MONOTRIBUTO]: "Monotributo",
  [CondicionFiscal.CONSUMIDOR_FINAL]: "Consumidor final",
  [CondicionFiscal.EXENTO]: "Exento",
};

/**
 * Persona física (nombre+apellido+dni) o jurídica (razonSocial+cuit) — nunca
 * ambos juegos de campos a la vez (se valida con Zod, ver cliente.schemas.ts).
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
  createdAt: string;
  updatedAt: string;
}

/** Nombre para mostrar: razón social si es persona jurídica, nombre+apellido si es física. */
export function nombreCliente(cliente: Cliente): string {
  return cliente.razonSocial ?? [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");
}

/** Documento para mostrar: CUIT si es persona jurídica, DNI si es física. */
export function documentoCliente(cliente: Cliente): string {
  return cliente.cuit ?? cliente.dni ?? "—";
}
