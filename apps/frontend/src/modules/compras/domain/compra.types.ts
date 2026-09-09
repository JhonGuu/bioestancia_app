/**
 * Espejo de `apps/backend/src/modules/compras/domain/*`.
 */

/**
 * Ver `apps/backend/src/modules/compras/domain/especie-animal.ts`.
 * Objeto `as const` en vez de `enum` (ver comentario en `auth.types.ts`).
 */
export const EspecieAnimal = {
  PORCINO: "porcino",
  BOVINO: "bovino",
  OTRO: "otro",
} as const;
export type EspecieAnimal = (typeof EspecieAnimal)[keyof typeof EspecieAnimal];

export const ESPECIE_ANIMAL_LABELS: Record<EspecieAnimal, string> = {
  [EspecieAnimal.PORCINO]: "Porcino",
  [EspecieAnimal.BOVINO]: "Bovino",
  [EspecieAnimal.OTRO]: "Otro",
};

/**
 * Ver `apps/backend/src/modules/compras/domain/categoria-porcino.ts`.
 * Catálogo AFIP (WSLSP) de categorías porcinas — el valor ya es el texto a
 * mostrar, no hace falta un mapa de labels aparte.
 */
export const CategoriaPorcino = {
  PADRILLO: "Porcina Padrillo",
  CERDA_CHANCHA: "Porcina Cerda / Chancha",
  LECHONES_LIVIANOS: "Porcina Lechones Livianos",
  LECHONES_PESADOS_CACHORROS_PARRILLEROS: "Porcina Lechones Pesados Y Cachorros Parrilleros",
  CAPON: "Porcina Capón",
  CACHORRO: "Porcina Cachorro",
  MACHOS_ENTEROS_INMUNOCASTRADOS: "Porcina Machos Enteros Inmunocastrados",
  CACHORRA: "Porcina Cachorra",
} as const;
export type CategoriaPorcino = (typeof CategoriaPorcino)[keyof typeof CategoriaPorcino];

/**
 * Ver `apps/backend/src/modules/compras/domain/raza-porcino.ts`. Catálogo
 * AFIP (WSLSP) de razas porcinas.
 */
export const RazaPorcino = {
  YORKSHIRE_LARGE_WHITE: "YORKSHIRE / LARGE-WHITE",
  LANDRACE_DANES: "LANDRACE (DANÉS)",
  LANDRACE_BELGA: "LANDRACE (BELGA)",
  PIETRAIN: "PIETRAIN",
  DUROC_HERSEY: "DUROC HERSEY",
  HAMPSHIRE: "HAMPSHIRE",
  LINEA_HIBRIDA_MATERNA: "LÍNEA HÍBRIDA MATERNA",
  LINEA_HIBRIDA_PATERNA: "LÍNEA HÍBRIDA PATERNA",
  OTRA: "Otra",
  DECOMISADO: "XD - Decomisado",
  GOLPEADO: "XZ - Golpeado",
  CAIDOS: "Caídos",
  CRUZA: "Cruza",
} as const;
export type RazaPorcino = (typeof RazaPorcino)[keyof typeof RazaPorcino];

/**
 * Línea de categoría/raza dentro de una compra — el remito/DTE real ya viene
 * separado así (ej. "30 machos + 90 hembras"), no es un total único.
 * `pesoBruto`/`pesoNeto` son nullable: se discriminan recién al armar la
 * liquidación de compra, no al crear la compra (el peso de la tropa entera
 * vive en `Compra.pesoBruto`/`pesoNeto`, ver más abajo). Los campos de fase 2
 * (resultado de faena) y fase 3 (liquidación) también son nullable.
 */
export interface CompraCategoria {
  id: string;
  compraId: string;
  categoria: CategoriaPorcino;
  raza: RazaPorcino | null;
  cabezas: number;
  pesoBruto: number | null;
  pesoNeto: number | null;
  kgVivoFaena: number | null;
  kgCarne: number | null;
  porcentajeMagro: number | null;
  destinoComercial: string | null;
  cuartosDelantero: number | null;
  cuartosTrasero: number | null;
  /** Cabezas/kg de ESTA categoría decomisados en la faena (sanitario) — 0 si no se cargó ninguno, `null` hasta que se carga el resultado de faena. */
  comisosCabezas: number | null;
  comisosKg: number | null;
  precioKg: number | null;
  importeBruto: number | null;
  porcentajeIva: number | null;
  importeIva: number | null;
  /** Fase 4: lo que cobra el FRIGORÍFICO por faenar (canon $/animal, ya combina lo facturado + lo efectivo). */
  canonFaenaPorAnimal: number | null;
  canonFaenaSubtotal: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `cantidadAnimales` NO es un escalar acá: es la suma de `CompraCategoria[]`
 * (ver helper `totalCabezas` más abajo). `pesoBruto`/`pesoNeto` en cambio SÍ
 * son un escalar (se pesa la tropa entera en la báscula, sin discriminar
 * por categoría). `cerrada` se activa con la acción "Cerrar compra", que
 * reconcilia cabezas vendidas contra compradas y calcula `rinde`.
 */
export interface Compra {
  id: string;
  empresaId: string;
  proveedorId: string;
  numero: string;
  especie: EspecieAnimal;
  letra: string | null;
  fecha: string;
  dte: string;
  remito: string;
  /** $/kg en pie negociado con el proveedor para esta tropa (sin IVA) — referencia, no lo facturado final. */
  precioCompraKg: number | null;
  porcentajeDesbaste: number;
  /** Kg vivo de báscula de la tropa entera (sin discriminar por categoría). */
  pesoBruto: number;
  /** `pesoBruto × (1 - porcentajeDesbaste / 100)`, calculado en el server. */
  pesoNeto: number;
  cerrada: boolean;
  fechaCierre: string | null;
  pesoFinalVenta: number | null;
  rinde: number | null;
  /** Grupo de tropas al que pertenece (ver `modules/grupos-tropas`) — `null` si es una tropa suelta. */
  grupoTropasId: string | null;
  /** `true` si al cerrar (tropa suelta, o heredado del grupo) las cabezas vendidas superaron a las compradas — aviso visible, no bloquea. */
  alertaSuperavit: boolean;
  comentarios: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompraConCategorias extends Compra {
  categorias: CompraCategoria[];
}

export function totalCabezas(categorias: CompraCategoria[]): number {
  return categorias.reduce((acc, c) => acc + c.cabezas, 0);
}

/** "45 - A" (o solo "45" si todavía no tiene letra asignada). */
export function compraNumeroYLetra(compra: Pick<Compra, "numero" | "letra">): string {
  return compra.letra ? `${compra.numero} - ${compra.letra}` : compra.numero;
}

/**
 * Stock TEÓRICO de una tropa abierta — ver `ObtenerStockTropas` en el
 * backend. Solo tropas no cerradas (`GET /compras/stock`).
 */
/** Cabezas compradas de una categoría puntual dentro de una tropa — ver `StockTropa.categorias`. */
export interface StockTropaCategoria {
  categoria: CategoriaPorcino;
  cabezas: number;
}

export interface StockTropa extends Compra {
  cabezasCompradas: number;
  cabezasVendidas: number;
  stockRestante: number;
  /** Categorías de esta tropa con sus cabezas compradas — ver `etiquetasStockTropa`. */
  categorias: StockTropaCategoria[];
}

/**
 * "CHA" si la tropa tiene alguna línea de Cerda/Chancha, "CAP" si tiene
 * Capón o Machos Enteros Inmunocastrados (MEI) — para que quien planifica el
 * reparto vea de un vistazo qué tipo de animal queda en cada tropa, sin
 * tener que abrir el detalle. Puede devolver ambas etiquetas si la tropa
 * mezcla categorías.
 */
export function etiquetasStockTropa(categorias: Pick<StockTropaCategoria, "categoria">[]): string[] {
  const tags = new Set<string>();
  for (const { categoria } of categorias) {
    if (categoria === CategoriaPorcino.CERDA_CHANCHA) tags.add("CHA");
    if (categoria === CategoriaPorcino.CAPON || categoria === CategoriaPorcino.MACHOS_ENTEROS_INMUNOCASTRADOS) {
      tags.add("CAP");
    }
  }
  return [...tags];
}
