import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

/**
 * Una fila `Tipo: Pago` de la hoja de un cliente que se interpretó como un
 * pago real (`Cobro` con una sola línea) — ver mapeo Concepto → MedioPago en
 * `plan-carga-inicial-datos.md`.
 */
export interface CobroAImportar {
  hoja: string;
  clienteId: string | null;
  clienteEsNuevo: boolean;
  fila: number;
  fecha: string; // ISO yyyy-mm-dd
  medioPago: MedioPago;
  monto: number;
  /** Solo se completan (con datos mínimos, ver `mapeo-concepto-pago.util.ts`) cuando `medioPago` es CHEQUE/ECHEQ. */
  numeroCheque: string | null;
  bancoCheque: string | null;
  observaciones: string | null;
}

/**
 * Una fila `Tipo: Pago` que se interpretó como un cargo administrativo
 * (`CargoCuentaCorriente`) en vez de un pago — ej. Gasoil, Recargo por
 * cheque, Ajuste por diferencia.
 */
export interface CargoAImportar {
  hoja: string;
  clienteId: string | null;
  clienteEsNuevo: boolean;
  fila: number;
  fecha: string; // ISO yyyy-mm-dd
  tipo: TipoCargo;
  monto: number;
  motivo: string | null;
  /** `true` para las filas `Concepto: "Saldo inicial"` (corte 2025-12-28) — ver plan de carga inicial, Etapa 4. */
  esSaldoInicial: boolean;
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
  /** Filas `Concepto: "Saldo inicial"` con importe $0 — no son error, simplemente no generan cargo (`CargoCuentaCorriente.monto` nunca puede ser cero). */
  saldosInicialesEnCero: number;
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
