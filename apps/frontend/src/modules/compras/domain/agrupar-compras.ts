import type { Compra } from "@/modules/compras/domain/compra.types";
import { nombreProveedor, type Proveedor } from "@/modules/proveedores/domain/proveedor.types";

/**
 * Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 * Definido en el orden en que tiene sentido anidar los niveles cuando se
 * combinan varios a la vez (ver `agruparComprasAnidado`): de fecha más
 * ancha a más angosta, y proveedor al final — `Object.values(...)` de este
 * objeto ES la jerarquía, no hace falta mantener un orden aparte.
 */
export const CriterioAgrupacion = {
  ANIO: "anio",
  MES: "mes",
  SEMANA: "semana",
  DIA: "dia",
  PROVEEDOR: "proveedor",
} as const;
export type CriterioAgrupacion = (typeof CriterioAgrupacion)[keyof typeof CriterioAgrupacion];

export const CRITERIO_AGRUPACION_LABELS: Record<CriterioAgrupacion, string> = {
  [CriterioAgrupacion.ANIO]: "Año",
  [CriterioAgrupacion.MES]: "Mes",
  [CriterioAgrupacion.SEMANA]: "Semana",
  [CriterioAgrupacion.DIA]: "Día",
  [CriterioAgrupacion.PROVEEDOR]: "Proveedor",
};

/** Jerarquía fija para anidar niveles combinados — ver el comentario de `CriterioAgrupacion`. */
const JERARQUIA = Object.values(CriterioAgrupacion);

/** Un único nivel de agrupación (sin anidar) — bloque interno de `agruparComprasAnidado`. */
export interface GrupoCompras {
  clave: string;
  titulo: string;
  compras: Compra[];
}

/**
 * Un nivel de la agrupación anidada. `subgrupos === null` marca una hoja
 * (ahí va la tabla de tropas); si no es null, hay que seguir bajando un
 * nivel más — `compras` en un nodo intermedio son TODAS las de la rama
 * (unión de sus subgrupos), útil para mostrar el conteo en el header sin
 * tener que sumarlo aparte.
 */
export interface NodoGrupoCompras {
  clave: string;
  titulo: string;
  compras: Compra[];
  subgrupos: NodoGrupoCompras[] | null;
}

/**
 * Todas las comparaciones de fecha acá usan getters UTC, no locales — a
 * propósito, mismo criterio que `modules/boletas/domain/filtro-periodo.ts`:
 * `Compra.fecha` viaja como medianoche UTC del día calendario elegido, así
 * que agruparla con getters locales podría correr una tropa al día/mes/año
 * de al lado según el huso horario de quien mira la pantalla.
 */
function inicioDeSemanaUTC(fecha: Date): Date {
  const dia = fecha.getUTCDay(); // 0 domingo .. 6 sábado
  const diff = (dia === 0 ? -6 : 1) - dia;
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate() + diff));
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

type CriterioFecha =
  | typeof CriterioAgrupacion.ANIO
  | typeof CriterioAgrupacion.MES
  | typeof CriterioAgrupacion.SEMANA
  | typeof CriterioAgrupacion.DIA;

/** Clave (para agrupar), orden (para ordenar los grupos, más reciente primero) y título a mostrar. */
function clavePeriodo(fecha: Date, criterio: CriterioFecha): { clave: string; orden: number; titulo: string } {
  const opcionesUTC = { timeZone: "UTC" } as const;

  if (criterio === CriterioAgrupacion.ANIO) {
    const anio = fecha.getUTCFullYear();
    return { clave: `${anio}`, orden: anio, titulo: `${anio}` };
  }

  if (criterio === CriterioAgrupacion.MES) {
    const anio = fecha.getUTCFullYear();
    const mes = fecha.getUTCMonth();
    return {
      clave: `${anio}-${mes}`,
      orden: anio * 12 + mes,
      titulo: capitalizar(fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric", ...opcionesUTC })),
    };
  }

  if (criterio === CriterioAgrupacion.SEMANA) {
    const inicio = inicioDeSemanaUTC(fecha);
    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 6);
    const inicioStr = inicio.toLocaleDateString("es-AR", { day: "numeric", month: "short", ...opcionesUTC });
    const finStr = fin.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", ...opcionesUTC });
    return { clave: inicio.toISOString(), orden: inicio.getTime(), titulo: `Semana del ${inicioStr} al ${finStr}` };
  }

  // DIA
  return {
    clave: fecha.toISOString(),
    orden: fecha.getTime(),
    titulo: capitalizar(fecha.toLocaleDateString("es-AR", { dateStyle: "long", ...opcionesUTC })),
  };
}

/** Un único nivel de agrupación — building block de `agruparComprasAnidado`, no pensado para usarse solo. */
function agruparUnNivel(compras: Compra[], criterio: CriterioAgrupacion, proveedores: Proveedor[]): GrupoCompras[] {
  if (criterio === CriterioAgrupacion.PROVEEDOR) {
    const nombrePorId = new Map(proveedores.map((p) => [p.id, nombreProveedor(p)]));
    const porProveedor = new Map<string, Compra[]>();
    for (const compra of compras) {
      const arr = porProveedor.get(compra.proveedorId) ?? [];
      arr.push(compra);
      porProveedor.set(compra.proveedorId, arr);
    }
    return [...porProveedor.entries()]
      .map(([proveedorId, comprasProveedor]) => ({
        clave: proveedorId,
        titulo: nombrePorId.get(proveedorId) || "Proveedor sin nombre",
        compras: comprasProveedor,
      }))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, "es"));
  }

  const porClave = new Map<string, { titulo: string; orden: number; compras: Compra[] }>();
  for (const compra of compras) {
    const { clave, orden, titulo } = clavePeriodo(new Date(compra.fecha), criterio);
    const existente = porClave.get(clave);
    if (existente) existente.compras.push(compra);
    else porClave.set(clave, { titulo, orden, compras: [compra] });
  }

  return [...porClave.values()]
    .sort((a, b) => b.orden - a.orden)
    .map(({ titulo, compras: comprasGrupo }, i) => ({ clave: String(i), titulo, compras: comprasGrupo }));
}

/** Los criterios elegidos, en el orden fijo en que hay que anidarlos (ver `JERARQUIA`), sin duplicados. */
export function ordenarCriterios(criterios: CriterioAgrupacion[]): CriterioAgrupacion[] {
  const elegidos = new Set(criterios);
  return JERARQUIA.filter((c) => elegidos.has(c));
}

/**
 * Agrupa `compras` anidando TODOS los criterios elegidos a la vez (ej. "Mes"
 * + "Proveedor" → una sección por mes, y dentro de cada mes una subsección
 * por proveedor) — no hay que elegir uno solo. El orden de anidado sigue
 * siempre la jerarquía fija (fecha de más ancha a más angosta, proveedor al
 * final), sin importar en qué orden se hayan tildado los checkboxes.
 *
 * `criterios` vacío devuelve `[]` — el caller (`tropas.tsx`) trata "sin
 * ningún criterio elegido" como "sin agrupar" y muestra la tabla plana en su
 * lugar, no llama a esta función.
 */
export function agruparComprasAnidado(
  compras: Compra[],
  criterios: CriterioAgrupacion[],
  proveedores: Proveedor[],
): NodoGrupoCompras[] {
  return construirNiveles(compras, ordenarCriterios(criterios), proveedores);
}

function construirNiveles(
  compras: Compra[],
  criteriosOrdenados: CriterioAgrupacion[],
  proveedores: Proveedor[],
): NodoGrupoCompras[] {
  const [criterioActual, ...resto] = criteriosOrdenados;
  if (!criterioActual) return [];

  return agruparUnNivel(compras, criterioActual, proveedores).map((grupo) => ({
    clave: grupo.clave,
    titulo: grupo.titulo,
    compras: grupo.compras,
    subgrupos: resto.length > 0 ? construirNiveles(grupo.compras, resto, proveedores) : null,
  }));
}
