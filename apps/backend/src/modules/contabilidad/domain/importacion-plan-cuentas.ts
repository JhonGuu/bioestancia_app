import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

/** Una fila del Excel ya interpretada (tipo/booleanos parseados) pero sin resolver contra el plan existente todavía. */
export interface FilaPlanCuentasCruda {
  /** Número de fila tal cual se ve en la planilla. */
  fila: number;
  codigo: string;
  nombre: string;
  /** `null` si el texto de la columna "Tipo" no matcheó ningún `TipoCuenta`. */
  tipo: TipoCuenta | null;
  /** El texto crudo de la columna "Tipo" — para el mensaje de error si no matcheó. */
  tipoTexto: string;
  codigoPadre: string | null;
  imputable: boolean;
  monetaria: boolean;
  requiereAuxiliar: TipoAuxiliar;
}

/** Una fila ya validada y lista para crear (o para mostrar en la previsualización). */
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
  /** Códigos que ya existen en el plan de esta empresa — se saltean, igual que `SembrarPlanCuentas`. */
  yaExistentes: { fila: number; codigo: string }[];
  conError: FilaPlanCuentasConError[];
}

export interface ResultadoImportacionPlanCuentas {
  creadas: number;
  omitidas: number;
}
