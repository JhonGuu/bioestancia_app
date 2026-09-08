import type { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import type { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import type { RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento.types";

export type TipoPlantillaImportacion = "plan-cuentas" | "asientos" | "saldos-iniciales";

// ── Plan de cuentas ──────────────────────────────
export interface CuentaAImportar {
  fila: number;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  codigoPadre: string | null;
  imputable: boolean;
  monetaria: boolean;
  requiereAuxiliar: TipoAuxiliar;
}

export interface FilaPlanCuentasConError {
  fila: number;
  codigo: string;
  errores: string[];
}

export interface PreviewImportacionPlanCuentas {
  totalFilas: number;
  aCrear: CuentaAImportar[];
  /** Códigos que ya existen en el plan — se saltean, no cuentan como error. */
  yaExistentes: { fila: number; codigo: string }[];
  conError: FilaPlanCuentasConError[];
}

export interface ResultadoImportacionPlanCuentas {
  creadas: number;
  omitidas: number;
}

// ── Asientos ─────────────────────────────────────
export interface LineaAsientoImportar {
  cuentaId: string;
  debe: number;
  haber: number;
  detalle?: string | null;
  auxiliarTipo?: TipoAuxiliar | null;
  auxiliarId?: string | null;
  fechaOrigen?: string | null;
  centroCostoId?: string | null;
}

export interface AsientoAImportar {
  claveOriginal: string;
  filas: number[];
  /** ISO yyyy-mm-dd. */
  fecha: string;
  descripcion: string;
  tipo: TipoAsiento;
  respaldo: RespaldoAsiento;
  lineas: LineaAsientoImportar[];
  totalDebe: number;
  totalHaber: number;
}

export interface AsientoImportarConError {
  claveOriginal: string;
  filas: number[];
  errores: string[];
}

export interface PreviewImportacionAsientos {
  totalFilas: number;
  totalAsientos: number;
  aCrear: AsientoAImportar[];
  conError: AsientoImportarConError[];
}

export interface ResultadoImportacionAsientosItem {
  claveOriginal: string;
  ok: boolean;
  numero?: number | null;
  error?: string;
}

export interface ResultadoImportacionAsientos {
  creados: number;
  fallidos: number;
  detalle: ResultadoImportacionAsientosItem[];
}

// ── Saldos iniciales ─────────────────────────────
// El confirm de esta importación no es un endpoint propio: se manda
// directo a `/contabilidad/asientos/apertura` (ver `apertura.schemas.ts`),
// por eso acá solo hace falta el tipo de la previsualización.
export interface SaldoAImportar {
  fila: number;
  codigoCuenta: string;
  nombreCuenta: string;
  cuentaId: string;
  importe: number;
  auxiliarTipo?: TipoAuxiliar | null;
  auxiliarId?: string | null;
  detalle?: string | null;
}

export interface FilaSaldoConError {
  fila: number;
  codigoCuenta: string;
  errores: string[];
}

export interface PreviewImportacionSaldosIniciales {
  totalFilas: number;
  aCargar: SaldoAImportar[];
  conError: FilaSaldoConError[];
  totales: { debe: number; haber: number; diferencia: number };
}
