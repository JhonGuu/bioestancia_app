import { RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento";
import { LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";

/** Un asiento armado a partir de un grupo de filas del Excel, ya validado y listo para crear. */
export interface AsientoAImportar {
  /** La clave de la columna "Asiento" que agrupó estas filas — solo para mostrarla, no viaja a la base. */
  claveOriginal: string;
  /** Filas del Excel que forman este asiento (para poder decir "filas 12 a 15" en la previsualización). */
  filas: number[];
  /** ISO yyyy-mm-dd. */
  fecha: string;
  descripcion: string;
  tipo: TipoAsiento;
  respaldo: RespaldoAsiento;
  lineas: LineaAsientoInput[];
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
