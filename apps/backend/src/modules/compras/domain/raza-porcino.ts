/**
 * Razas porcinas del catálogo AFIP (WSLSP), las mismas que usa ARCA en la
 * carga manual de la liquidación de compra. Ver el comentario en
 * `categoria-porcino.ts` sobre por qué es un enum de aplicación (no un
 * `pgEnum` de Postgres).
 */
export enum RazaPorcino {
  YORKSHIRE_LARGE_WHITE = "YORKSHIRE / LARGE-WHITE",
  LANDRACE_DANES = "LANDRACE (DANÉS)",
  LANDRACE_BELGA = "LANDRACE (BELGA)",
  PIETRAIN = "PIETRAIN",
  DUROC_HERSEY = "DUROC HERSEY",
  HAMPSHIRE = "HAMPSHIRE",
  LINEA_HIBRIDA_MATERNA = "LÍNEA HÍBRIDA MATERNA",
  LINEA_HIBRIDA_PATERNA = "LÍNEA HÍBRIDA PATERNA",
  OTRA = "Otra",
  DECOMISADO = "XD - Decomisado",
  GOLPEADO = "XZ - Golpeado",
  CAIDOS = "Caídos",
  CRUZA = "Cruza",
}
