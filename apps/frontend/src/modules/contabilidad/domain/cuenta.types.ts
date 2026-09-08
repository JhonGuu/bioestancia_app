import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

/** Espejo de `apps/backend/src/modules/contabilidad/domain/cuenta.ts`. */
export interface Cuenta {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  parentId: string | null;
  imputable: boolean;
  monetaria: boolean;
  requiereAuxiliar: TipoAuxiliar;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CuentaNodo extends Cuenta {
  hijos: CuentaNodo[];
}

/** Arma el árbol jerárquico a partir de la lista plana — mismo criterio que el backend. */
export function construirArbolCuentas(cuentas: Cuenta[]): CuentaNodo[] {
  const nodos = new Map<string, CuentaNodo>();
  for (const cuenta of cuentas) nodos.set(cuenta.id, { ...cuenta, hijos: [] });

  const raices: CuentaNodo[] = [];
  for (const nodo of nodos.values()) {
    const padre = nodo.parentId ? nodos.get(nodo.parentId) : undefined;
    if (padre) padre.hijos.push(nodo);
    else raices.push(nodo);
  }

  const ordenar = (lista: CuentaNodo[]): CuentaNodo[] => {
    lista.sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true }));
    for (const nodo of lista) ordenar(nodo.hijos);
    return lista;
  };

  return ordenar(raices);
}

/** Aplana el árbol en orden jerárquico (padre, después hijos) — para selects/pickers de cuenta. */
export function aplanarArbol(nodos: CuentaNodo[]): CuentaNodo[] {
  return nodos.flatMap((nodo) => [nodo, ...aplanarArbol(nodo.hijos)]);
}

/** Profundidad del nodo en el árbol (0 = raíz) — para indentar en la UI. */
export function profundidad(nodo: Cuenta, cuentasPorId: Map<string, Cuenta>): number {
  let nivel = 0;
  let actual: Cuenta | undefined = nodo;
  while (actual?.parentId) {
    actual = cuentasPorId.get(actual.parentId);
    nivel += 1;
  }
  return nivel;
}
