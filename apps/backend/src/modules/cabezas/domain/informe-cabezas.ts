/**
 * Los dos grupos que trackea la vista "Cabezas". El negocio NO separa el
 * catálogo AFIP completo (Capón, MEI, Cachorra, Cachorro, Padrillo, Lechones,
 * ...) — todas esas categorías se venden/planifican igual, la única que
 * importa diferenciar es CHANCHA (cerdas de descarte: más pesadas, otro
 * precio). Por eso "CAPON" acá es en realidad "todo lo que no sea Chancha",
 * no solo `CategoriaPorcino.CAPON` — ver el filtro en
 * `use-cases/obtener-informe-cabezas.use-case.ts` (`perteneceAGrupo`).
 */
export type GrupoCabezas = "CAPON" | "CHANCHA";

export const GRUPOS_CABEZAS: readonly GrupoCabezas[] = ["CAPON", "CHANCHA"];

/**
 * Una fila = un cliente, dentro del bloque de UNA categoría, para UNA semana
 * puntual.
 *
 * `cantEstimada` es la suma de `PlanificacionCabezas.cabezasPlanificadas` de
 * ese cliente en los 7 días de la semana (ver
 * `use-cases/obtener-informe-cabezas.use-case.ts`) — la planificación NO
 * distingue categoría (un plan es "tantas cabezas", sin decir de qué
 * categoría), así que este número es el mismo en todos los bloques de
 * categoría de un mismo cliente/semana. Se repite tal cual (no se reparte
 * entre categorías) para no inventar una precisión que no existe todavía.
 *
 * `cantReal`/`kg`/`montoTotal` SÍ están filtrados a esta categoría puntual —
 * salen de `ventas` cruzando `categoria` + `formaVenta` (ver el use-case).
 * `cantReal` cuenta "cabeza" entera como 1 y "media_res" como 0.5 (mismo
 * criterio que la planilla Excel: una media res son dos ventas de un mismo
 * garrón, cada una vale medio animal).
 *
 * `precioPromedio` es el precio ponderado ($ total / kg total) de ESTE
 * cliente en esta categoría/semana — no el promedio simple de precios
 * unitarios. `null` si no hubo ventas de esta categoría a este cliente esa
 * semana (no hay con qué dividir).
 */
export interface LineaCabezasCliente {
  clienteId: string;
  clienteNombre: string;
  cantEstimada: number;
  cantReal: number;
  kg: number;
  montoTotal: number;
  precioPromedio: number | null;
}

/**
 * El bloque completo de UNA categoría para UNA semana: los totales de la
 * categoría (mismo criterio de precio ponderado que cada línea) + la lista de
 * clientes con actividad (estimado y/o real > 0 — un cliente sin ninguno de
 * los dos no aporta nada a la vista y se omite).
 *
 * `precioMinimo` es el mínimo de los `precioPromedio` de línea (ignora los
 * `null`) — el precio más bajo al que se le vendió a ALGÚN cliente esta
 * categoría esta semana, mismo dato que la fila "min" de la planilla Excel.
 */
export interface BloqueCabezasCategoria {
  grupo: GrupoCabezas;
  totalCabezas: number;
  totalKg: number;
  totalMonto: number;
  precioPromedio: number | null;
  precioMinimo: number | null;
  lineas: LineaCabezasCliente[];
}

/**
 * El informe completo de una semana ISO puntual: un bloque por cada grupo de
 * `GRUPOS_CABEZAS`, en ese orden.
 */
export interface InformeCabezas {
  anio: number;
  semana: number;
  /** Rango de la semana ISO (lunes a domingo) — `hasta` inclusive acá, a diferencia de `rangoSemanaIso` (para mostrar en pantalla). */
  desde: Date;
  hasta: Date;
  bloques: BloqueCabezasCategoria[];
}
