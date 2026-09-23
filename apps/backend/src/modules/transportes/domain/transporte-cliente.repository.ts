import { Chofer } from "@/modules/transportes/domain/chofer";
import { Vehiculo } from "@/modules/transportes/domain/vehiculo";

/**
 * Choferes y vehículos autorizados para retirar mercadería de un cliente
 * (relación muchos a muchos). Sirve para avisar en el despacho cuando alguien
 * que no está en la lista viene a retirar.
 */
export interface TransporteCliente {
  choferes: Chofer[];
  vehiculos: Vehiculo[];
}

export interface TransporteClienteRepository {
  /** Solo los choferes/vehículos activos autorizados para ese cliente. */
  getAutorizados(clienteId: string, empresaId: string): Promise<TransporteCliente>;
  /** Reemplaza de una sola vez ambas listas (en una transacción). */
  setAutorizados(
    clienteId: string,
    empresaId: string,
    choferIds: string[],
    vehiculoIds: string[],
  ): Promise<void>;
}
