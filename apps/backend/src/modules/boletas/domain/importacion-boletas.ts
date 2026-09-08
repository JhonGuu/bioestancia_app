import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

/**
 * Una venta ya resuelta a partir de una fila `Tipo: Venta` de la hoja
 * histórica de un cliente (ver `infra/import/planilla-historica-cliente.util.ts`
 * para el mapeo Forma de venta → `FormaVenta`/`categoria`).
 */
export interface VentaAImportar {
  /** Número de fila en la hoja de origen — para señalar errores puntuales. */
  fila: number;
  formaVenta: FormaVenta;
  categoria: CategoriaVenta | null;
  /** Puede ser negativo SOLO en `COMPENSACION_KG` — mismo criterio que la carga manual. */
  kg: number;
  /** `Importe / kg` de la fila original, redondeado a 2 decimales. `null` si el importe vino en 0. */
  precioKg: number | null;
  observaciones: string | null;
}

/** Un grupo de ventas del mismo cliente y misma fecha — se importa como UNA boleta (decisión: agrupar por cliente+día). */
export interface BoletaAImportar {
  /** Nombre de la hoja de origen (para mostrarlo en la previsualización — no viaja a la base). */
  hoja: string;
  /**
   * `null` si no se encontró un cliente ya cargado con ese nombre — en ese
   * caso `ConfirmarImportacionBoletas` lo crea (`razonSocial` = `hoja`, sin
   * separar nombre/apellido — decisión de Juan Jose) antes de crear la
   * boleta. Ver también `clienteEsNuevo`.
   */
  clienteId: string | null;
  clienteEsNuevo: boolean;
  /** ISO yyyy-mm-dd. */
  fecha: string;
  /** Números de fila de la hoja de origen que forman este grupo. */
  filas: number[];
  ventas: VentaAImportar[];
  /** Suma de `kg * precioKg` de las ventas del grupo — solo informativo para la previsualización. */
  totalImporte: number;
}

export interface FilaImportarBoletaConError {
  hoja: string;
  /** 0 cuando el error es de la hoja entera (ej. no se pudo leer), no de una fila puntual. */
  fila: number;
  errores: string[];
}

export interface PreviewImportacionBoletas {
  /** Hojas de cliente que se intentaron procesar (excluye las de la lista de exclusión). */
  hojasProcesadas: string[];
  /** Hojas que se ignoraron a propósito (auxiliares del libro, o marcadas para no usar). */
  hojasOmitidas: string[];
  totalFilasVenta: number;
  /** Nombres de hoja para los que no se encontró un cliente ya cargado — se van a crear al confirmar. */
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
