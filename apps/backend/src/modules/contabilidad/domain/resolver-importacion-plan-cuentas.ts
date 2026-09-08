import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import {
  CuentaAImportar,
  FilaPlanCuentasConError,
  FilaPlanCuentasCruda,
} from "@/modules/contabilidad/domain/importacion-plan-cuentas";

export interface ResolucionImportacionPlanCuentas {
  aCrear: CuentaAImportar[];
  yaExistentes: { fila: number; codigo: string }[];
  conError: FilaPlanCuentasConError[];
  /**
   * `aCrear` agrupado por capa de dependencia (0 = las que no dependen de
   * ninguna otra fila del lote), en orden ascendente — así se puede
   * insertar capa por capa, igual que `SembrarPlanCuentas`, sin violar la
   * referencia de padre.
   */
  porNivel: Map<number, CuentaAImportar[]>;
}

/**
 * Valida y resuelve la jerarquía de un lote de filas del Excel contra el
 * plan de cuentas ya existente — función pura, no toca la base. La usa
 * tanto la previsualización (para mostrar errores antes de escribir nada)
 * como la confirmación (para saber en qué orden crear los niveles), así
 * las dos ven exactamente lo mismo.
 *
 * El padre de una fila puede estar tanto en la base (`cuentasExistentes`)
 * como en el mismo archivo — se resuelve por capas (todas las filas cuyo
 * padre ya está resuelto en la capa anterior), lo que de paso detecta sin
 * casos especiales tanto un padre inexistente como una referencia
 * circular entre padres: si en una vuelta no se resolvió ninguna fila más,
 * las que quedan pendientes son un error.
 *
 * Reutiliza las mismas reglas que `CrearCuenta`: el padre no puede ser
 * imputable, y el tipo de la cuenta tiene que coincidir con el de su padre.
 */
export function resolverImportacionPlanCuentas(
  filas: FilaPlanCuentasCruda[],
  cuentasExistentes: Cuenta[],
): ResolucionImportacionPlanCuentas {
  const existentesPorCodigo = new Map(cuentasExistentes.map((c) => [c.codigo, c]));
  const yaExistentes: { fila: number; codigo: string }[] = [];
  const conError: FilaPlanCuentasConError[] = [];
  const primeraApuesta = new Map<string, number>();
  const candidatas: CuentaAImportar[] = [];

  for (const fila of filas) {
    const errores: string[] = [];
    if (!fila.codigo) errores.push("Falta el código");
    if (!fila.nombre) errores.push("Falta el nombre");
    if (!fila.tipo) errores.push(`Tipo de cuenta no reconocido: "${fila.tipoTexto || "(vacío)"}"`);

    if (errores.length > 0) {
      conError.push({ fila: fila.fila, codigo: fila.codigo || "(sin código)", errores });
      continue;
    }

    if (existentesPorCodigo.has(fila.codigo)) {
      yaExistentes.push({ fila: fila.fila, codigo: fila.codigo });
      continue;
    }

    if (primeraApuesta.has(fila.codigo)) {
      conError.push({
        fila: fila.fila,
        codigo: fila.codigo,
        errores: [`El código "${fila.codigo}" está repetido — ya aparece en la fila ${primeraApuesta.get(fila.codigo)}`],
      });
      continue;
    }
    primeraApuesta.set(fila.codigo, fila.fila);

    candidatas.push({
      fila: fila.fila,
      codigo: fila.codigo,
      nombre: fila.nombre,
      tipo: fila.tipo as TipoCuenta,
      codigoPadre: fila.codigoPadre,
      imputable: fila.imputable,
      monetaria: fila.monetaria,
      requiereAuxiliar: fila.requiereAuxiliar,
    });
  }

  const resueltos = new Map<string, CuentaAImportar>();
  const porNivel: CuentaAImportar[][] = [];
  let pendientes = candidatas;

  while (pendientes.length > 0) {
    const resolublesAhora: CuentaAImportar[] = [];
    const siguientes: CuentaAImportar[] = [];

    for (const candidata of pendientes) {
      const padreResuelto =
        !candidata.codigoPadre || existentesPorCodigo.has(candidata.codigoPadre) || resueltos.has(candidata.codigoPadre);
      (padreResuelto ? resolublesAhora : siguientes).push(candidata);
    }

    if (resolublesAhora.length === 0) {
      for (const candidata of siguientes) {
        conError.push({
          fila: candidata.fila,
          codigo: candidata.codigo,
          errores: [
            `No se encontró la cuenta padre "${candidata.codigoPadre}" — ni en el plan existente ni en este archivo (o hay una referencia circular entre padres)`,
          ],
        });
      }
      break;
    }

    const delNivel: CuentaAImportar[] = [];
    for (const candidata of resolublesAhora) {
      const padre = candidata.codigoPadre
        ? (existentesPorCodigo.get(candidata.codigoPadre) ?? resueltos.get(candidata.codigoPadre))
        : undefined;

      const errores: string[] = [];
      if (padre) {
        if (padre.imputable) {
          errores.push(`"${candidata.codigoPadre}" es una cuenta imputable — no se le pueden colgar cuentas hijas`);
        }
        if (padre.tipo !== candidata.tipo) {
          errores.push(`El tipo tiene que coincidir con el de la cuenta padre (${padre.tipo})`);
        }
      }

      if (errores.length > 0) {
        conError.push({ fila: candidata.fila, codigo: candidata.codigo, errores });
        continue;
      }

      resueltos.set(candidata.codigo, candidata);
      delNivel.push(candidata);
    }

    if (delNivel.length > 0) porNivel.push(delNivel);
    pendientes = siguientes;
  }

  return {
    aCrear: [...resueltos.values()],
    yaExistentes,
    conError,
    porNivel: new Map(porNivel.map((lista, indice) => [indice, lista])),
  };
}
