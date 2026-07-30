/**
 * Categorías porcinas del catálogo AFIP (WSLSP — "Consultar Categorías"),
 * las mismas que usa ARCA en la carga manual de la liquidación de compra.
 * Enum en vez de string libre para no terminar con variantes inconsistentes
 * ("Capón" vs "capon" vs "CAPON") — mismo criterio que `CondicionFiscal`.
 *
 * Se guarda tal cual (texto), no como `pgEnum` de Postgres — ver el
 * comentario en `modules/proveedores/domain/codigo-afip-porcino.ts` sobre
 * por qué evitamos enums de Postgres para catálogos que vienen de afuera
 * (AFIP los puede ajustar, y algunas descripciones son largas).
 */
export enum CategoriaPorcino {
  PADRILLO = "Porcina Padrillo",
  CERDA_CHANCHA = "Porcina Cerda / Chancha",
  LECHONES_LIVIANOS = "Porcina Lechones Livianos",
  LECHONES_PESADOS_CACHORROS_PARRILLEROS = "Porcina Lechones Pesados Y Cachorros Parrilleros",
  CAPON = "Porcina Capón",
  CACHORRO = "Porcina Cachorro",
  MACHOS_ENTEROS_INMUNOCASTRADOS = "Porcina Machos Enteros Inmunocastrados",
  CACHORRA = "Porcina Cachorra",
}
