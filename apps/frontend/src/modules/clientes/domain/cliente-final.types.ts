/**
 * Espejo de `apps/backend/src/modules/clientes/domain/cliente-final.ts`.
 * Destino de reventa de un cliente revendedor (ej. "Ivan") — ver
 * `esRevendedor` en `cliente.types.ts`.
 */
export interface ClienteFinal {
  id: string;
  empresaId: string;
  clienteId: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
