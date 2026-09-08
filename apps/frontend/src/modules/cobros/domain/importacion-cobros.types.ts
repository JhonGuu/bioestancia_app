/**
 * Espejo de `apps/backend/src/modules/cobros/domain/importacion-cobros.ts`.
 */

import type { MedioPago } from "@/modules/cobros/domain/cobro.types";
import type { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.types";

export interface CobroAImportar {
  hoja: string;
  clienteId: string | null;
  clienteEsNuevo: boolean;
  fila: number;
  /** ISO yyyy-mm-dd. */
  fecha: string;
  medioPago: MedioPago;
  monto: number;
  numeroCheque: string | null;
  bancoCheque: string | null;
  observaciones: string | null;
}

export interface CargoAImportar {
  hoja: string;
  clienteId: string | null;
  clienteEsNuevo: boolean;
  fila: number;
  /** ISO yyyy-mm-dd. */
  fecha: string;
  tipo: TipoCargo;
  monto: number;
  motivo: string | null;
}

export interface FilaImportarCobroConError {
  hoja: string;
  fila: number;
  errores: string[];
}

export interface PreviewImportacionCobros {
  hojasProcesadas: string[];
  hojasOmitidas: string[];
  totalFilasPago: number;
  saldosInicialesOmitidos: number;
  clientesNuevos: string[];
  cobrosACrear: CobroAImportar[];
  cargosACrear: CargoAImportar[];
  conError: FilaImportarCobroConError[];
}

export interface ResultadoImportacionCobrosItem {
  hoja: string;
  fila: number;
  tipo: "cobro" | "cargo";
  fecha: string;
  ok: boolean;
  id?: string;
  error?: string;
}

export interface ResultadoImportacionCobros {
  creados: number;
  fallidos: number;
  detalle: ResultadoImportacionCobrosItem[];
}
