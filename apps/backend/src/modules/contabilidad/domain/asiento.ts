import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

export enum TipoAsiento {
  MANUAL = "manual",
  /** Generado por el motor de reglas a partir de una operación (fase 2). */
  AUTOMATICO = "automatico",
  APERTURA = "apertura",
  CIERRE = "cierre",
  REFUNDICION = "refundicion",
  AJUSTE_INFLACION = "ajuste_inflacion",
  RECLASIFICACION = "reclasificacion",
}

export enum EstadoAsiento {
  /** Editable. No numerado todavía, no impacta en los informes definitivos. */
  BORRADOR = "borrador",
  /** Numerado y firme. Editable solo mientras el período esté abierto. */
  CONFIRMADO = "confirmado",
  ANULADO = "anulado",
}

/**
 * Respaldo documental del asiento. Es lo que permite sacar del MISMO dato
 * la vista real (todo) y la vista respaldada (solo lo documentado), sin
 * llevar dos contabilidades paralelas que después no se hablan.
 */
export enum RespaldoAsiento {
  CON_COMPROBANTE = "con_comprobante",
  SIN_COMPROBANTE = "sin_comprobante",
  /** Asientos que por naturaleza no tienen comprobante: apertura, cierre, ajustes. */
  INTERNO = "interno",
}

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
  /**
   * Fecha de origen de la partida, para la anticuación del ajuste por
   * inflación (fase 5). Por defecto es la fecha del asiento, pero se puede
   * pisar: una mercadería comprada en marzo que sigue en stock en diciembre
   * se reexpresa desde marzo, no desde diciembre.
   */
  fechaOrigen: Date;
  centroCostoId: string | null;
}

export interface Asiento {
  id: string;
  empresaId: string;
  ejercicioId: string;
  periodoId: string;
  /** Correlativo por ejercicio. `null` mientras está en borrador. */
  numero: number | null;
  fecha: Date;
  tipo: TipoAsiento;
  estado: EstadoAsiento;
  respaldo: RespaldoAsiento;
  descripcion: string;
  /** Documento que lo originó, ej. "boleta" / "liquidacion_compra" (fase 2). */
  origenTipo: string | null;
  origenId: string | null;
  lineas: LineaAsiento[];
  createdAt: Date;
  updatedAt: Date;
}

/** Redondeo a 2 decimales — evita que la suma de numerics arrastre error. */
export function redondear2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export interface TotalesAsiento {
  debe: number;
  haber: number;
  diferencia: number;
}

export function calcularTotales(lineas: { debe: number; haber: number }[]): TotalesAsiento {
  const debe = redondear2(lineas.reduce((acc, l) => acc + l.debe, 0));
  const haber = redondear2(lineas.reduce((acc, l) => acc + l.haber, 0));
  return { debe, haber, diferencia: redondear2(debe - haber) };
}

/** La regla de oro de la partida doble: la suma del debe iguala a la del haber. */
export function estaBalanceado(lineas: { debe: number; haber: number }[]): boolean {
  return calcularTotales(lineas).diferencia === 0;
}
