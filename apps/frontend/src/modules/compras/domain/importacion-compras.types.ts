/**
 * Espejo de `apps/backend/src/modules/compras/domain/importacion-compras.ts`.
 */

import type { CategoriaPorcino } from "@/modules/compras/domain/compra.types";

/** Línea de categoría ya resuelta al enum del dominio, con las cabezas parseadas de la columna "Animal". */
export interface CategoriaCompraAImportar {
  categoria: CategoriaPorcino;
  cabezas: number;
}

/**
 * Una tropa lista para crear con TODO el detalle que trae la planilla:
 * compra + categorías + resultado de faena + liquidación de compra +
 * liquidación de faena.
 */
export interface CompraAImportar {
  fila: number;
  numero: string;
  proveedorNombre: string;
  proveedorId: string | null;
  frigorificoNombre: string | null;
  frigorificoId: string | null;
  /** ISO `AAAA-MM-DD`. */
  fecha: string;
  fechaFaena: string;
  dte: string;
  remito: string;
  precioCompraKg: number;
  pesoBruto: number;
  pesoNeto: number;
  porcentajeDesbaste: number;
  categorias: CategoriaCompraAImportar[];

  kgVivoTotalFaena: number;
  kgCarneTotalFaena: number;

  numeroComprobanteLiquidacion: string;
  porcentajeIvaLiquidacion: number;

  montoFaenaTotal: number;

  rentabilidadReferenciaExcel: string | null;
}

export interface FilaImportarCompraConError {
  fila: number;
  numeroTropa: string | null;
  errores: string[];
}

export interface PreviewImportacionCompras {
  filasProcesadas: number;
  comprasACrear: CompraAImportar[];
  proveedoresNuevos: string[];
  frigorificosNuevos: string[];
  conError: FilaImportarCompraConError[];
}

export interface ResultadoImportacionCompraItem {
  fila: number;
  numero: string;
  ok: boolean;
  compraId?: string;
  error?: string;
}

export interface ResultadoImportacionCompras {
  creadas: number;
  fallidas: number;
  detalle: ResultadoImportacionCompraItem[];
}
