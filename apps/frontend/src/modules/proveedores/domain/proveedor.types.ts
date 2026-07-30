/**
 * Espejo de `apps/backend/src/modules/proveedores/domain/proveedor.ts`.
 * Módulo mínimo por ahora: solo lo necesario para el selector de proveedor
 * en el alta de compras (ver `modules/compras`) — no hay listado/alta propia
 * de proveedores todavía.
 */

import { CondicionFiscal } from "@/modules/clientes/domain/cliente.types";

/**
 * Ver `apps/backend/src/modules/proveedores/domain/codigo-afip-porcino.ts`.
 * Código + descripción del WSLSP (AFIP) juntos en un solo valor — así es
 * como se usa al armar la liquidación de compra, y así se guarda en la base.
 * Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 */
export const CodigoAfipPorcino = {
  PRODUCTORES_CRIADORES_COMERCIALES: "100 - Productores/Criadores Comerciales - Porcinos",
  INVERNADORES: "101 - Invernadores - Porcinos",
  MATADERO_FRIGORIFICO: "102 - Matadero - Frigorífico - Porcinos",
  MATARIFES_ABASTECEDORES:
    "103 - Matarifes abastecedores y carniceros y usuarios de faena porcina - Porcinos",
  CONSIGNATARIOS_COMISIONISTAS_HACIENDA: "104 - Consignatarios y/o comisionistas de hacienda - Porcinos",
  CONSIGNATARIOS_DIRECTOS: "105 - Consignatarios directos - Porcinos",
  CONSIGNATARIOS_COMISIONISTAS_CARNES: "106 - Consignatario y/o comisionistas de Carnes - Porcinos",
} as const;
export type CodigoAfipPorcino = (typeof CodigoAfipPorcino)[keyof typeof CodigoAfipPorcino];

export interface Proveedor {
  id: string;
  empresaId: string;
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
  datosBancarios: string | null;
  porcentajeDesbaste: number | null;
  /** RENSPA (SENASA) del establecimiento, formato "NN.NNN.N.NNNNN/NN". */
  renspa: string | null;
  /** Código AFIP (WSLSP) para liquidaciones de compra. */
  codigoAfip: CodigoAfipPorcino | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Nombre para mostrar: razón social si es persona jurídica, nombre+apellido si es física. */
export function nombreProveedor(proveedor: Proveedor): string {
  return (
    proveedor.razonSocial ?? [proveedor.nombre, proveedor.apellido].filter(Boolean).join(" ")
  );
}

/** Documento para mostrar: CUIT si es persona jurídica, DNI si es física. */
export function documentoProveedor(proveedor: Proveedor): string {
  return proveedor.cuit ?? proveedor.dni ?? "—";
}
