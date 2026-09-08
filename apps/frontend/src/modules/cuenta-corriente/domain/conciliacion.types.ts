/** Espejo de `ObtenerConciliacionClientes` (fase 2 de contabilidad) en el backend. */
export interface FilaConciliacionCliente {
  clienteId: string;
  nombreCliente: string;
  /** Desde boletas/ventas/cobros/cargos — el mismo cálculo que el saldo de cuenta corriente. */
  saldoAuxiliar: number;
  /** Desde el mayor de la cuenta de control, solo asientos confirmados. */
  saldoContable: number;
  diferencia: number;
}

export interface ConciliacionClientes {
  cuenta: { id: string; codigo: string; nombre: string };
  filas: FilaConciliacionCliente[];
  totalAuxiliar: number;
  totalContable: number;
  totalDiferencia: number;
}
