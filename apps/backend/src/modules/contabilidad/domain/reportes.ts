import { Cuenta, CuentaNodo, construirArbolCuentas } from "@/modules/contabilidad/domain/cuenta";
import { redondear2 } from "@/modules/contabilidad/domain/asiento";
import { tieneSaldoDeudor } from "@/modules/contabilidad/domain/tipo-cuenta";

/** Saldo de una cuenta a partir de sus sumas, ya resuelto a su lado natural. */
export interface SaldoCuenta {
  sumaDebe: number;
  sumaHaber: number;
  /** Positivo = saldo del lado natural de la cuenta; negativo = saldo invertido. */
  saldo: number;
}

/**
 * Calcula el saldo de una cuenta según su naturaleza (ver `tieneSaldoDeudor`).
 * Activo/resultado negativo: saldo = debe - haber. Pasivo/PN/resultado
 * positivo: saldo = haber - debe.
 */
export function calcularSaldoCuenta(
  cuenta: Pick<Cuenta, "tipo">,
  sumaDebe: number,
  sumaHaber: number,
): SaldoCuenta {
  const saldo = tieneSaldoDeudor(cuenta.tipo)
    ? redondear2(sumaDebe - sumaHaber)
    : redondear2(sumaHaber - sumaDebe);
  return { sumaDebe: redondear2(sumaDebe), sumaHaber: redondear2(sumaHaber), saldo };
}

export interface MovimientoPorCuenta {
  sumaDebe: number;
  sumaHaber: number;
}

/** Nodo de sumas y saldos: la cuenta + lo que acumuló (propio + hijas). */
export interface SumaYSaldoNodo extends CuentaNodo {
  sumaDebe: number;
  sumaHaber: number;
  saldo: number;
  hijos: SumaYSaldoNodo[];
}

/**
 * Arma el árbol de sumas y saldos: cada cuenta imputable trae sus propios
 * movimientos, y cada cuenta de agrupación ("1.1 ACTIVO CORRIENTE") acumula
 * la suma de sus hijas, aunque nunca haya recibido un asiento — así el
 * informe se puede leer a cualquier nivel de la jerarquía.
 */
export function armarSumasYSaldos(
  cuentas: Cuenta[],
  movimientosPorCuenta: Map<string, MovimientoPorCuenta>,
): SumaYSaldoNodo[] {
  const arbol = construirArbolCuentas(cuentas);

  const acumular = (nodo: CuentaNodo): SumaYSaldoNodo => {
    const hijosAcumulados = nodo.hijos.map(acumular);
    const propio = movimientosPorCuenta.get(nodo.id);
    let sumaDebe = propio?.sumaDebe ?? 0;
    let sumaHaber = propio?.sumaHaber ?? 0;
    for (const hijo of hijosAcumulados) {
      sumaDebe = redondear2(sumaDebe + hijo.sumaDebe);
      sumaHaber = redondear2(sumaHaber + hijo.sumaHaber);
    }
    const { saldo } = calcularSaldoCuenta(nodo, sumaDebe, sumaHaber);
    return { ...nodo, hijos: hijosAcumulados, sumaDebe, sumaHaber, saldo };
  };

  return arbol.map(acumular);
}

/** Una línea del mayor, ya con su saldo acumulado. */
export interface MovimientoMayor {
  asientoId: string;
  numero: number | null;
  fecha: Date;
  descripcion: string;
  detalle: string | null;
  auxiliarTipo: string | null;
  auxiliarId: string | null;
  debe: number;
  haber: number;
  /** Saldo en el lado natural de la cuenta, después de este movimiento. */
  saldo: number;
}

/**
 * Arma el mayor de una cuenta: parte del saldo anterior y va acumulando
 * cada movimiento en el lado natural de la cuenta. Los movimientos tienen
 * que venir ya en orden cronológico (fecha, número de asiento).
 */
export function armarMayorCuenta(
  cuenta: Pick<Cuenta, "tipo">,
  saldoAnterior: number,
  movimientos: Omit<MovimientoMayor, "saldo">[],
): { saldoAnterior: number; movimientos: MovimientoMayor[]; saldoFinal: number } {
  const esDeudora = tieneSaldoDeudor(cuenta.tipo);
  let saldo = saldoAnterior;
  const conSaldo = movimientos.map((mov) => {
    saldo = redondear2(saldo + (esDeudora ? mov.debe - mov.haber : mov.haber - mov.debe));
    return { ...mov, saldo };
  });
  return { saldoAnterior, movimientos: conSaldo, saldoFinal: saldo };
}
