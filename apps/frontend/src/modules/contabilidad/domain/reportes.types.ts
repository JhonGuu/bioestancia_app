import { Asiento, TotalesAsiento } from "@/modules/contabilidad/domain/asiento.types";
import { CuentaNodo } from "@/modules/contabilidad/domain/cuenta.types";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

/** Espejo de las respuestas de `use-cases/obtener-*` del backend. */
export interface LibroDiario {
  asientos: Asiento[];
  totales: TotalesAsiento;
}

export interface MovimientoMayor {
  asientoId: string;
  numero: number | null;
  fecha: string;
  descripcion: string;
  detalle: string | null;
  auxiliarTipo: TipoAuxiliar | null;
  auxiliarId: string | null;
  debe: number;
  haber: number;
  saldo: number;
}

export interface MayorCuenta {
  cuenta: { id: string; codigo: string; nombre: string };
  saldoAnterior: number;
  movimientos: MovimientoMayor[];
  saldoFinal: number;
}

export interface SumaYSaldoNodo extends CuentaNodo {
  sumaDebe: number;
  sumaHaber: number;
  saldo: number;
  hijos: SumaYSaldoNodo[];
}

export interface SumasYSaldos {
  arbol: SumaYSaldoNodo[];
  totalDebe: number;
  totalHaber: number;
  diferencia: number;
}
