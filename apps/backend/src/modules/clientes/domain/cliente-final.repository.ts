import { ClienteFinal } from "@/modules/clientes/domain/cliente-final";

/**
 * Interface del repositorio de ClienteFinal. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en todos los métodos — mismo patrón que el resto de
 * los repositorios.
 */
export interface ClienteFinalRepository {
  getById(id: string, empresaId: string): Promise<ClienteFinal | null>;

  /** Lista los destinos activos de un cliente revendedor puntual. */
  listByCliente(clienteId: string, empresaId: string): Promise<ClienteFinal[]>;

  create(input: CreateClienteFinalInput): Promise<ClienteFinal>;
}

export interface CreateClienteFinalInput {
  empresaId: string;
  clienteId: string;
  nombre: string;
}
