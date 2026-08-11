/**
 * Destino de reventa de un cliente revendedor (ver `esRevendedor` en
 * `domain/cliente.ts`) — ej. uno de los locales a los que "Ivan" le reparte.
 * Existe para poder anotar, de forma trazable (sin texto libre propenso a
 * typos/duplicados), a quién le llegó cada ítem de reventa de una boleta.
 *
 * `clienteId` es el revendedor DUEÑO de este destino — el destino en sí NO es
 * un `Cliente` de Bioestancia, es solo un nombre de referencia para el
 * control interno del revendedor.
 */
export interface ClienteFinal {
  id: string;
  empresaId: string;
  clienteId: string;
  nombre: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
