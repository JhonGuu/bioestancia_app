/**
 * Espejo de `apps/backend/src/modules/cuenta-corriente/domain/saldo-cliente.ts`.
 */
export interface SaldoCliente {
  clienteId: string;
  saldoVencido: number;
  saldoPorVencer: number;
  saldoTotal: number;
  saldoAFavor: number;
}
