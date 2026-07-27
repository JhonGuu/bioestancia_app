/**
 * Forma en la que se vendió el animal/producto. Enum en vez de string libre
 * (mismo criterio que `CondicionFiscal`): evita terminar con variantes tipo
 * "Cabeza capón" / "cabeza capon" / "CABEZA CAPON" en la misma tabla.
 *
 * `COMPENSACION_KG` es la excepción: no es una venta real de una cabeza, es un
 * ajuste de kilos (a favor o en contra) sobre una venta anterior. Por eso en
 * `ventas` el `garron`/`tropaId` son nullable — una compensación no tiene
 * animal físico asociado.
 */
export enum FormaVenta {
  CABEZA_CAPON = "cabeza_capon",
  CABEZA_CHANCHA = "cabeza_chancha",
  MEDIA_RES_CAPON = "media_res_capon",
  PULPA = "pulpa",
  COMPENSACION_KG = "compensacion_kg",
}
