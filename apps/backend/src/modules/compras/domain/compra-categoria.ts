/**
 * Línea de categoría/raza dentro de una compra.
 *
 * El remito/DTE de una compra real ya viene separado por categoría (ej.
 * "30 machos + 90 hembras", o "36 Capón / 124 Macho Entero Inmunocastrado")
 * — no es un total único. Por eso `cantidadAnimales`/`pesoBruto`/`pesoNeto`
 * NO viven como escalares en `Compra`: son la suma de estas líneas.
 *
 * La misma línea se va completando en 3 momentos distintos del negocio,
 * todos referidos a la MISMA categoría/raza (se confirmó que una compra
 * siempre se faena entera, 1 a 1, y con las mismas categorías):
 *
 * 1. Al cargar la compra: `categoria`, `raza`, `cabezas`, `pesoBruto` (kg
 *    vivo de báscula) y `pesoNeto` (calculado con el `porcentajeDesbaste`
 *    de la compra).
 * 2. Al cargar el resultado de faena (`resultado-faena`, doc. SENASA que
 *    entrega el frigorífico): `kgVivoFaena` (puede diferir un poco del
 *    `pesoBruto` de compra — es el kg vivo verificado en planta),
 *    `kgCarne`, `porcentajeMagro`, `destinoComercial`, `cuartosDelantero`,
 *    `cuartosTrasero`.
 * 3. Al emitir la liquidación de compra (`liquidacion-compra`, comprobante
 *    AFIP que se le manda al criadero): `precioKg` (se factura sobre el kg
 *    vivo de faena, no sobre el neto), `importeBruto`, `porcentajeIva`,
 *    `importeIva`.
 *
 * Todos los campos de las fases 2 y 3 son nullable: se completan después,
 * no al crear la compra.
 */
export interface CompraCategoria {
  id: string;
  compraId: string;
  categoria: string;
  raza: string | null;
  cabezas: number;
  pesoBruto: number;
  pesoNeto: number;
  kgVivoFaena: number | null;
  kgCarne: number | null;
  porcentajeMagro: number | null;
  destinoComercial: string | null;
  cuartosDelantero: number | null;
  cuartosTrasero: number | null;
  precioKg: number | null;
  importeBruto: number | null;
  porcentajeIva: number | null;
  importeIva: number | null;
  createdAt: Date;
  updatedAt: Date;
}
