import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

/**
 * Un cargo adicional en la cuenta corriente de un cliente (recargo por
 * cheque, comisión por rechazo, u otro ajuste manual) — suma directamente
 * al saldo del cliente, igual que una boleta, pero sin estar atado a
 * ninguna venta.
 *
 * `chequeId` referencia el cheque que originó el cargo, cuando corresponde
 * (`RECARGO_CHEQUE`/`COMISION_RECHAZO`) — nullable porque `OTRO` no
 * necesariamente viene de un cheque.
 */
export interface CargoCuentaCorriente {
  id: string;
  empresaId: string;
  clienteId: string;
  tipo: TipoCargo;
  monto: number;
  chequeId: string | null;
  motivo: string | null;
  fecha: Date;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
