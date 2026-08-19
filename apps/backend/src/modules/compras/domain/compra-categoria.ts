import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { RazaPorcino } from "@/modules/compras/domain/raza-porcino";

/**
 * Línea de categoría/raza dentro de una compra.
 *
 * El remito/DTE de una compra real ya viene separado por categoría (ej.
 * "30 machos + 90 hembras", o "36 Capón / 124 Macho Entero Inmunocastrado")
 * — no es un total único. Por eso `cabezas` NO vive como escalar en
 * `Compra`: es la suma de estas líneas. `pesoBruto`/`pesoNeto` en cambio SÍ
 * son un escalar de `Compra` (ver ese archivo): en la báscula se pesa la
 * tropa entera de una vez, no discriminada por categoría.
 *
 * La misma línea se va completando en 3 momentos distintos del negocio,
 * todos referidos a la MISMA categoría/raza (se confirmó que una compra
 * siempre se faena entera, 1 a 1, y con las mismas categorías):
 *
 * 1. Al cargar la compra: `categoria`, `raza`, `cabezas`. `pesoBruto`/
 *    `pesoNeto` de esta línea NO se cargan acá — recién se conoce el
 *    desglose por categoría más adelante.
 * 2. Al cargar el resultado de faena (`resultado-faena`, doc. SENASA que
 *    entrega el frigorífico): `kgVivoFaena` (kg vivo verificado en planta,
 *    ya discriminado por categoría), `kgCarne`, `porcentajeMagro`,
 *    `destinoComercial`, `cuartosDelantero`, `cuartosTrasero`,
 *    `comisosCabezas`/`comisosKg` (decomiso sanitario atribuido a ESTA
 *    categoría puntual — el frigorífico dice a qué categoría le descuenta el
 *    decomiso, no es un total de tropa). El total de la tropa en
 *    `ResultadoFaena.comisosCabezas`/`comisosKg` se calcula sumando estas
 *    líneas, mismo criterio que `kgVivoTotal`/`kgCarneTotal`.
 * 3. Al emitir la liquidación de compra (`liquidacion-compra`, comprobante
 *    AFIP que se le manda al criadero): ahí recién se discrimina el peso
 *    por categoría (`pesoBruto`, `pesoNeto`), y se completan `precioKg`
 *    (se factura sobre el kg vivo de faena, no sobre el neto),
 *    `importeBruto`, `porcentajeIva`, `importeIva`.
 * 4. Al cargar la liquidación de faena (`liquidacion-faena`, lo que el
 *    FRIGORÍFICO les cobra por faenar — canon distinto según categoría, ej.
 *    Capón/MEI/Cachorra vs Chancha/Cerda): `canonFaenaPorAnimal` ($/animal,
 *    ya combina lo facturado + lo efectivo, no se separan) y
 *    `canonFaenaSubtotal` (= `cabezas` × `canonFaenaPorAnimal`, calculado en
 *    el server).
 *
 * Todos los campos de las fases 2, 3 y 4 son nullable: se completan después,
 * no al crear la compra.
 */
export interface CompraCategoria {
  id: string;
  compraId: string;
  categoria: CategoriaPorcino;
  raza: RazaPorcino | null;
  cabezas: number;
  /** Nullable: se discrimina recién al armar la liquidación de compra. */
  pesoBruto: number | null;
  /** Nullable: ídem `pesoBruto`. */
  pesoNeto: number | null;
  kgVivoFaena: number | null;
  kgCarne: number | null;
  porcentajeMagro: number | null;
  destinoComercial: string | null;
  cuartosDelantero: number | null;
  cuartosTrasero: number | null;
  /** Cabezas de ESTA categoría decomisadas en la faena (sanitario) — 0 si no se cargó ninguna, `null` hasta que se carga el resultado de faena. */
  comisosCabezas: number | null;
  /** Kg de ESTA categoría decomisados en la faena — 0 si no se cargó ninguno, `null` hasta que se carga el resultado de faena. */
  comisosKg: number | null;
  precioKg: number | null;
  importeBruto: number | null;
  porcentajeIva: number | null;
  importeIva: number | null;
  canonFaenaPorAnimal: number | null;
  canonFaenaSubtotal: number | null;
  createdAt: Date;
  updatedAt: Date;
}
