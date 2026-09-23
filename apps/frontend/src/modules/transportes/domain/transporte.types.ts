/**
 * Espejo de los tipos del módulo `transportes` del backend
 * (`apps/backend/src/modules/transportes/domain`). Las fechas son "AAAA-MM-DD".
 * Objetos `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 */

export const TipoVehiculo = {
  CAMION: "camion",
  JAULA: "jaula",
  ACOPLADO: "acoplado",
  SEMI: "semi",
  UTILITARIO: "utilitario",
  OTRO: "otro",
} as const;
export type TipoVehiculo = (typeof TipoVehiculo)[keyof typeof TipoVehiculo];

export const TIPO_VEHICULO_LABELS: Record<TipoVehiculo, string> = {
  camion: "Camión",
  jaula: "Jaula",
  acoplado: "Acoplado",
  semi: "Semi",
  utilitario: "Utilitario",
  otro: "Otro",
};

export type EstadoTransporteFiltro = "activos" | "inactivos" | "todos";

export const ESTADO_TRANSPORTE_LABELS: Record<EstadoTransporteFiltro, string> = {
  activos: "Activos",
  inactivos: "Inactivos",
  todos: "Todos",
};

export interface Transportista {
  id: string;
  empresaId: string;
  nombre: string;
  /** 11 dígitos, sin guiones. */
  cuit: string;
  telefono: string | null;
  /** El transportista es la propia empresa (camión y chofer propios). */
  esPropio: boolean;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chofer {
  id: string;
  empresaId: string;
  transportistaId: string | null;
  nombre: string;
  apellido: string;
  /** CUIT o CUIL, 11 dígitos sin guiones. */
  cuit: string;
  /** `null` si el usuario no tiene el permiso `ver_datos_choferes`. */
  dni: string | null;
  telefono: string | null;
  /** `null` si el usuario no tiene el permiso `ver_datos_choferes`. */
  licenciaVencimiento: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vehiculo {
  id: string;
  empresaId: string;
  transportistaId: string | null;
  tipo: TipoVehiculo;
  patente: string;
  descripcion: string | null;
  rtoVencimiento: string | null;
  seguroVencimiento: string | null;
  habilitacionAnimalesVencimiento: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Choferes y vehículos autorizados a retirar mercadería de un cliente. */
export interface TransporteCliente {
  choferes: Chofer[];
  vehiculos: Vehiculo[];
}

export function nombreChofer(chofer: Chofer): string {
  return `${chofer.apellido} ${chofer.nombre}`;
}
