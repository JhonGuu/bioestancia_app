import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

/**
 * Un saldo inicial ya resuelto contra el plan de cuentas, con la misma
 * forma que `SaldoInicialInput` (`generar-asiento-apertura.use-case.ts`)
 * más los datos de fila/cuenta para mostrarlo en la previsualización. El
 * confirm de esta importación no es un endpoint propio: el frontend arma
 * un `SaldoInicialInput[]` a partir de `aCargar` y lo manda directo a
 * `/contabilidad/asientos/apertura`, que ya existe.
 */
export interface SaldoAImportar {
  fila: number;
  codigoCuenta: string;
  nombreCuenta: string;
  cuentaId: string;
  /** Con signo — ver `GenerarAsientoApertura`. */
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
