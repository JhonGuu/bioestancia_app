/**
 * Presentación en la que se vendió/entregó — separado de la CATEGORÍA del
 * animal (Capón, Chancha, MEI, etc., ver `modules/compras/domain/categoria-porcino.ts`,
 * reusado acá como `Venta.categoria`).
 *
 * Antes esto mezclaba ambos conceptos en un solo enum (`cabeza_capon`,
 * `media_res_capon`, ...) — se separó porque la boleta necesita elegir
 * presentación y categoría de forma independiente (ej. "media res de Capón",
 * "cabeza de Chancha"), y así se reusa el mismo catálogo de categorías que
 * ya existe en `compras` en vez de mantener dos listas.
 *
 * `COMPENSACION_KG` sigue siendo la excepción: no es una venta real de un
 * animal, es un ajuste de kilos — no lleva `categoria` ni `garron`.
 */
export enum FormaVenta {
  CABEZA = "cabeza",
  MEDIA_RES = "media_res",
  PULPA = "pulpa",
  COMPENSACION_KG = "compensacion_kg",
}
