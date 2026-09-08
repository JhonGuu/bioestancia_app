import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

/**
 * Una cuenta del plan de cuentas. El plan es por empresa (Bioestancia y El
 * Meridiano tienen el suyo) y es 100% editable desde la app: el catálogo
 * base (`plan-cuentas-base.ts`) es solo un punto de partida.
 */
export interface Cuenta {
  id: string;
  empresaId: string;
  /** Código jerárquico, ej. "1.1.01.001". Único por empresa. */
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  /** Cuenta padre en el árbol. `null` en las cuentas de primer nivel. */
  parentId: string | null;
  /**
   * Solo las cuentas imputables reciben movimientos. Las de agrupación
   * ("1.1 ACTIVO CORRIENTE") existen para totalizar en los informes.
   */
  imputable: boolean;
  /**
   * Partida monetaria (efectivo, créditos y deudas en pesos). Las
   * monetarias NO se ajustan por inflación — ya están expresadas en moneda
   * de cierre. Las no monetarias (bienes de cambio, bienes de uso, capital,
   * resultados) sí. Ver RT 6.
   *
   * Este campo tiene que estar bien desde el día uno: el ajuste por
   * inflación de la fase 5 se apoya en él y reclasificar cuentas a mano
   * sobre dos años de asientos cargados es carísimo.
   */
  monetaria: boolean;
  /** Submayor obligatorio al imputar (ver `TipoAuxiliar`). */
  requiereAuxiliar: TipoAuxiliar;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Nodo del árbol del plan de cuentas — lo que consume la pantalla. */
export interface CuentaNodo extends Cuenta {
  hijos: CuentaNodo[];
}

/**
 * Arma el árbol a partir de la lista plana, ordenado por código en cada
 * nivel. Las cuentas huérfanas (padre inexistente o inactivo) se cuelgan de
 * la raíz en vez de desaparecer: es preferible que se vean y se puedan
 * corregir a que queden invisibles.
 */
export function construirArbolCuentas(cuentas: Cuenta[]): CuentaNodo[] {
  const nodos = new Map<string, CuentaNodo>();
  for (const cuenta of cuentas) {
    nodos.set(cuenta.id, { ...cuenta, hijos: [] });
  }

  const raices: CuentaNodo[] = [];
  for (const nodo of nodos.values()) {
    const padre = nodo.parentId ? nodos.get(nodo.parentId) : undefined;
    if (padre) {
      padre.hijos.push(nodo);
    } else {
      raices.push(nodo);
    }
  }

  const ordenar = (lista: CuentaNodo[]): CuentaNodo[] => {
    lista.sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }));
    for (const nodo of lista) ordenar(nodo.hijos);
    return lista;
  };

  return ordenar(raices);
}
