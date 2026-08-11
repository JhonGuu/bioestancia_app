import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";

/**
 * Mapea nuestro `CategoriaPorcino` (texto) al código numérico `categoriaPorcina`
 * que espera WSLSP (manual v2.0.3, sección "Consultar Categorías").
 * Confirmado contra el manual — a diferencia del payload de
 * `AutorizarLiquidacion` en sí (ver TODO en `wslsp.client.ts`), esta tabla de
 * códigos sí se pudo extraer completa.
 */
export const CATEGORIA_PORCINO_WSLSP: Record<CategoriaPorcino, number> = {
  [CategoriaPorcino.PADRILLO]: 520301,
  [CategoriaPorcino.CERDA_CHANCHA]: 520302,
  [CategoriaPorcino.LECHONES_LIVIANOS]: 52030301,
  [CategoriaPorcino.LECHONES_PESADOS_CACHORROS_PARRILLEROS]: 52030302,
  [CategoriaPorcino.CAPON]: 520304,
  [CategoriaPorcino.CACHORRO]: 520305,
  [CategoriaPorcino.MACHOS_ENTEROS_INMUNOCASTRADOS]: 520306,
  [CategoriaPorcino.CACHORRA]: 520307,
};
