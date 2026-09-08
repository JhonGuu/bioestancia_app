import { calcularTotales, redondear2 } from "@/modules/contabilidad/domain/asiento";
import { LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";
import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

const ETIQUETA_AUXILIAR: Record<TipoAuxiliar, string> = {
  [TipoAuxiliar.NINGUNO]: "",
  [TipoAuxiliar.CLIENTE]: "el cliente",
  [TipoAuxiliar.PROVEEDOR]: "el proveedor",
  [TipoAuxiliar.EMPLEADO]: "el empleado",
  [TipoAuxiliar.FRIGORIFICO]: "el frigorífico",
  [TipoAuxiliar.CUENTA_FONDOS]: "la cuenta de fondos",
  [TipoAuxiliar.CHEQUE]: "el cheque",
};

/**
 * Valida las líneas de un asiento contra el plan de cuentas. Devuelve TODOS
 * los errores encontrados, no solo el primero: al cargar un asiento de diez
 * líneas es mucho mejor ver los cuatro problemas juntos que descubrirlos de
 * a uno.
 *
 * Es una función pura (no toca la base) para poder testearla sola y para
 * reutilizarla desde la carga manual, la apertura y —más adelante— el motor
 * de asientos automáticos.
 */
export function validarLineasAsiento(
  lineas: LineaAsientoInput[],
  cuentasPorId: Map<string, Cuenta>,
): string[] {
  const errores: string[] = [];

  if (lineas.length < 2) {
    errores.push("El asiento tiene que tener al menos dos líneas");
  }

  lineas.forEach((linea, indice) => {
    const nro = indice + 1;
    const cuenta = cuentasPorId.get(linea.cuentaId);

    if (!cuenta) {
      errores.push(`Línea ${nro}: la cuenta no existe o no pertenece a esta empresa`);
      return;
    }
    if (!cuenta.imputable) {
      errores.push(
        `Línea ${nro}: "${cuenta.codigo} ${cuenta.nombre}" es una cuenta de agrupación, no recibe movimientos`,
      );
    }
    if (!cuenta.activa) {
      errores.push(`Línea ${nro}: la cuenta "${cuenta.codigo} ${cuenta.nombre}" está desactivada`);
    }

    const debe = redondear2(linea.debe);
    const haber = redondear2(linea.haber);
    if (debe < 0 || haber < 0) {
      errores.push(`Línea ${nro}: los importes no pueden ser negativos`);
    }
    if (debe > 0 && haber > 0) {
      errores.push(`Línea ${nro}: una línea imputa al debe o al haber, no a los dos`);
    }
    if (debe === 0 && haber === 0) {
      errores.push(`Línea ${nro}: la línea no tiene importe`);
    }

    if (cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO && !linea.auxiliarId) {
      errores.push(
        `Línea ${nro}: "${cuenta.nombre}" es una cuenta de control, hay que indicar ${ETIQUETA_AUXILIAR[cuenta.requiereAuxiliar]}`,
      );
    }
  });

  const totales = calcularTotales(lineas);
  if (totales.diferencia !== 0) {
    errores.push(
      `El asiento no balancea: debe ${totales.debe} contra haber ${totales.haber} (diferencia de ${Math.abs(totales.diferencia)})`,
    );
  }

  return errores;
}
