import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

/** Espejo de `apps/backend/src/modules/contabilidad/domain/asiento.ts`. */
export const TipoAsiento = {
  MANUAL: "manual",
  AUTOMATICO: "automatico",
  APERTURA: "apertura",
  CIERRE: "cierre",
  REFUNDICION: "refundicion",
  AJUSTE_INFLACION: "ajuste_inflacion",
  RECLASIFICACION: "reclasificacion",
} as const;
export type TipoAsiento = (typeof TipoAsiento)[keyof typeof TipoAsiento];

export const TIPO_ASIENTO_LABELS: Record<TipoAsiento, string> = {
  [TipoAsiento.MANUAL]: "Manual",
  [TipoAsiento.AUTOMATICO]: "Automático",
  [TipoAsiento.APERTURA]: "Apertura",
  [TipoAsiento.CIERRE]: "Cierre",
  [TipoAsiento.REFUNDICION]: "Refundición",
  [TipoAsiento.AJUSTE_INFLACION]: "Ajuste por inflación",
  [TipoAsiento.RECLASIFICACION]: "Reclasificación de resultados",
};

export const EstadoAsiento = {
  BORRADOR: "borrador",
  CONFIRMADO: "confirmado",
  ANULADO: "anulado",
} as const;
export type EstadoAsiento = (typeof EstadoAsiento)[keyof typeof EstadoAsiento];

export const ESTADO_ASIENTO_LABELS: Record<EstadoAsiento, string> = {
  [EstadoAsiento.BORRADOR]: "Borrador",
  [EstadoAsiento.CONFIRMADO]: "Confirmado",
  [EstadoAsiento.ANULADO]: "Anulado",
};

export const RespaldoAsiento = {
  CON_COMPROBANTE: "con_comprobante",
  SIN_COMPROBANTE: "sin_comprobante",
  INTERNO: "interno",
} as const;
export type RespaldoAsiento = (typeof RespaldoAsiento)[keyof typeof RespaldoAsiento];

export const RESPALDO_LABELS: Record<RespaldoAsiento, string> = {
  [RespaldoAsiento.CON_COMPROBANTE]: "Con comprobante",
  [RespaldoAsiento.SIN_COMPROBANTE]: "Sin comprobante",
  [RespaldoAsiento.INTERNO]: "Interno",
};

export interface LineaAsiento {
  id: string;
  asientoId: string;
  orden: number;
  cuentaId: string;
  debe: number;
  haber: number;
  detalle: string | null;
  auxiliarTipo: TipoAuxiliar | null;
  auxiliarId: string | null;
  fechaOrigen: string;
  centroCostoId: string | null;
}

export interface Asiento {
  id: string;
  empresaId: string;
  ejercicioId: string;
  periodoId: string;
  /** Correlativo por ejercicio. `null` mientras está en borrador. */
  numero: number | null;
  fecha: string;
  tipo: TipoAsiento;
  estado: EstadoAsiento;
  respaldo: RespaldoAsiento;
  descripcion: string;
  origenTipo: string | null;
  origenId: string | null;
  lineas: LineaAsiento[];
  createdAt: string;
  updatedAt: string;
}

/** Redondeo a 2 decimales — mismo criterio que el backend. */
export function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export interface TotalesAsiento {
  debe: number;
  haber: number;
  diferencia: number;
}

/**
 * Espejo de `calcularTotales` del backend — se usa para mostrar el balance
 * en vivo mientras se carga el asiento, sin esperar al submit.
 */
export function calcularTotales(lineas: { debe: number; haber: number }[]): TotalesAsiento {
  const debe = redondear2(lineas.reduce((acc, l) => acc + (l.debe || 0), 0));
  const haber = redondear2(lineas.reduce((acc, l) => acc + (l.haber || 0), 0));
  return { debe, haber, diferencia: redondear2(debe - haber) };
}

export function estaBalanceado(lineas: { debe: number; haber: number }[]): boolean {
  return calcularTotales(lineas).diferencia === 0;
}
