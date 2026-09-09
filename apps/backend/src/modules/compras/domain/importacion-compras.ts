import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";

/** Línea de categoría ya resuelta al enum del dominio, con las cabezas parseadas de la columna "Animal". */
export interface CategoriaCompraAImportar {
  categoria: CategoriaPorcino;
  cabezas: number;
}

/**
 * Una tropa lista para crear con TODO el detalle que trae la planilla:
 * compra + categorías + resultado de faena + liquidación de compra +
 * liquidación de faena. Ver `previsualizar-importacion-compras.use-case.ts`
 * para el detalle de qué columna de la planilla alimenta cada campo.
 */
export interface CompraAImportar {
  /** Fila de la planilla (para referencia/depuración). */
  fila: number;
  numero: string;
  proveedorNombre: string;
  /** `null` cuando no matcheó ningún proveedor existente por nombre — `confirmar` lo crea. */
  proveedorId: string | null;
  /** `null` cuando la fila no trae frigorífico — queda sin asignar, no bloquea la importación. */
  frigorificoNombre: string | null;
  /** `null` cuando no matcheó ningún frigorífico existente por nombre (o no hay `frigorificoNombre`) — `confirmar` lo crea si hace falta. */
  frigorificoId: string | null;
  /** ISO `AAAA-MM-DD`. */
  fecha: string;
  fechaFaena: string;
  dte: string;
  remito: string;
  precioCompraKg: number;
  pesoBruto: number;
  pesoNeto: number;
  /** `(1 - pesoNeto/pesoBruto) * 100`, redondeado — no viene explícito en la planilla. */
  porcentajeDesbaste: number;
  categorias: CategoriaCompraAImportar[];

  // --- Resultado de faena (1 a 1 con la compra) ---
  /** Peso vivo total de la tropa al momento de la faena — la planilla no distingue un re-pesaje en planta, se usa `Kg NETO jaula` como proxy (ver plan de carga inicial). */
  kgVivoTotalFaena: number;
  /** `Kg RENDIDOS` de la planilla — kg de carne obtenidos. */
  kgCarneTotalFaena: number;

  // --- Liquidación de compra (1 a 1 con la compra) ---
  /** Número de comprobante — con placeholder `"S/D (tropa N)"` cuando la planilla no lo trae (la gran mayoría de las filas). */
  numeroComprobanteLiquidacion: string;
  /** % de IVA implícito en la planilla (`precioConIva/precioSinIva - 1) * 100`) — en la práctica siempre 10.5%, alícuota reducida para carne. */
  porcentajeIvaLiquidacion: number;

  // --- Liquidación de faena (1 a 1 con la compra) ---
  /** Columna "Faena" — lo que cobra el frigorífico por faenar TODA la tropa (se reparte por cabeza al confirmar, un solo canon parejo para todas las categorías — la planilla no lo discrimina por categoría). */
  montoFaenaTotal: number;

  /** Texto armado con la ganancia/rentabilidad que ya traía calculada la planilla — se guarda tal cual en `Compra.comentarios`, NO se recalcula ni se valida contra el reporte de rentabilidad de la app (ver plan de carga inicial, sección "Rentabilidad histórica"). */
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
  /** Id de la `Compra` creada — solo presente cuando `ok` es `true`. */
  compraId?: string;
  error?: string;
}

export interface ResultadoImportacionCompras {
  creadas: number;
  fallidas: number;
  detalle: ResultadoImportacionCompraItem[];
}
