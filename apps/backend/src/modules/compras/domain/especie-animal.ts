/**
 * Especie del animal comprado. Enum en vez de string libre (mismo criterio
 * que `CondicionFiscal`/`FormaVenta`) — pensado para que el día de mañana se
 * pueda comprar bovino (u otra especie) sin tocar la estructura de `compras`:
 * sumar un valor acá es un `ALTER TYPE ... ADD VALUE` liviano, no rehace la
 * tabla.
 *
 * `OTRO` es una válvula de escape para una especie que todavía no dimos de
 * alta como valor propio.
 */
export enum EspecieAnimal {
  PORCINO = "porcino",
  BOVINO = "bovino",
  OTRO = "otro",
}
