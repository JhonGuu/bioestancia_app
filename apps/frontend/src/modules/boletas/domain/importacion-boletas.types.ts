/**
 * Espejo de `apps/backend/src/modules/boletas/domain/importacion-boletas.ts`.
 */

import type { FormaVenta } from "@/modules/ventas/domain/venta.types";
import type { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";

export interface VentaAImportar {
  fila: number;
  formaVenta: FormaVenta;
  categoria: CategoriaVenta | null;
  kg: number;
  precioKg: number | null;
  observaciones: string | null;
}

export interface BoletaAImportar {
  hoja: string;
  clienteId: string | null;
  clienteEsNuevo: boolean;
  /** ISO yyyy-mm-dd. */
  fecha: string;
  filas: number[];
  ventas: VentaAImportar[];
  totalImporte: number;
}

export interface FilaImportarBoletaConError {
  hoja: string;
  fila: number;
  errores: string[];
}

export interface PreviewImportacionBoletas {
  hojasProcesadas: string[];
  hojasOmitidas: string[];
  totalFilasVenta: number;
  clientesNuevos: string[];
  aCrear: BoletaAImportar[];
  conError: FilaImportarBoletaConError[];
}

export interface ResultadoImportacionBoletasItem {
  hoja: string;
  fecha: string;
  ok: boolean;
  boletaId?: string;
  error?: string;
}

export interface ResultadoImportacionBoletas {
  creadas: number;
  fallidas: number;
  detalle: ResultadoImportacionBoletasItem[];
}
