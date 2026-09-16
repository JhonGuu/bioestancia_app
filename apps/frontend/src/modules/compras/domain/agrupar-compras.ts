import type { Compra } from "@/modules/compras/domain/compra.types";
import { nombreProveedor, type Proveedor } from "@/modules/proveedores/domain/proveedor.types";

/**
 * Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 */
export const CriterioAgrupacion = {
  NINGUNO: "ninguno",
  ANIO: "anio",
  MES: "mes",
  SEMANA: "semana",
  DIA: "dia",
  PROVEEDOR: "proveedor",
} as const;
export type CriterioAgrupacion = (typeof CriterioAgrupacion)[keyof typeof CriterioAgrupacion];

export const CRITERIO_AGRUPACION_LABELS: Record<CriterioAgrupacion, string> = {
  [CriterioAgrupacion.NINGUNO]: "Sin agrupar",
  [CriterioAgrupacion.ANIO]: "Año",
  [CriterioAgrupacion.MES]: "Mes",
  [CriterioAgrupacion.SEMANA]: "Semana",
  [CriterioAgrupacion.DIA]: "Día",
  [CriterioAgrupacion.PROVEEDOR]: "Proveedor",
};

export interface GrupoCompras {
  clave: string;
  titulo: string;
  compras: Compra[];
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

/** Clave (para agrupar), orden (para ordenar los grupos, más reciente primero) y título a mostrar. */
function clavePeriodo(
  fecha: Date,
  criterio: typeof CriterioAgrupacion.ANIO | typeof CriterioAgrupacion.MES | typeof CriterioAgrupacion.SEMANA | typeof CriterioAgrupacion.DIA,
): { clave: string; orden: number; titulo: string } {
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

/**
 * Agrupa `compras` (se asume ya en el orden que se quiere mostrar dentro de
 * cada grupo — el backend las trae más nuevas primero) según `criterio`.
 * `"ninguno"` devuelve un único grupo con todo, para que el caller pueda
 * tratar "agrupado" y "sin agrupar" con el mismo tipo de dato.
 */
export function agruparCompras(
  compras: Compra[],
  criterio: CriterioAgrupacion,
  proveedores: Proveedor[],
): GrupoCompras[] {
  if (criterio === CriterioAgrupacion.NINGUNO) {
    return [{ clave: "todas", titulo: "Todas las tropas", compras }];
  }

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
