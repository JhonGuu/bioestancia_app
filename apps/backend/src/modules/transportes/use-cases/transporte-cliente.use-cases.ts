import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { ChoferRepository } from "@/modules/transportes/domain/chofer.repository";
import {
  TransporteCliente,
  TransporteClienteRepository,
} from "@/modules/transportes/domain/transporte-cliente.repository";
import { VehiculoRepository } from "@/modules/transportes/domain/vehiculo.repository";

async function asegurarCliente(
  repo: ClienteRepository,
  clienteId: string,
  empresaId: string,
): Promise<void> {
  const cliente = await repo.getById(clienteId, empresaId);
  if (!cliente) throw new ApiError("Cliente no encontrado", Code.NOT_FOUND);
}

@injectable()
export class GetTransporteCliente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepo: ClienteRepository,
    @inject(DI_TYPES.TransporteClienteRepository)
    private readonly repo: TransporteClienteRepository,
  ) {}

  async execute(input: { clienteId: string; empresaId: string }): Promise<TransporteCliente> {
    await asegurarCliente(this.clienteRepo, input.clienteId, input.empresaId);
    return this.repo.getAutorizados(input.clienteId, input.empresaId);
  }
}

export interface SetTransporteClienteInput {
  clienteId: string;
  empresaId: string;
  choferIds: string[];
  vehiculoIds: string[];
}

/**
 * Reemplaza las listas de choferes y vehículos autorizados de un cliente. Todo
 * id tiene que existir y ser de la misma empresa; si alguno no, no se guarda
 * nada.
 */
@injectable()
export class SetTransporteCliente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepo: ClienteRepository,
    @inject(DI_TYPES.ChoferRepository) private readonly choferRepo: ChoferRepository,
    @inject(DI_TYPES.VehiculoRepository) private readonly vehiculoRepo: VehiculoRepository,
    @inject(DI_TYPES.TransporteClienteRepository)
    private readonly repo: TransporteClienteRepository,
  ) {}

  async execute(input: SetTransporteClienteInput): Promise<TransporteCliente> {
    const { clienteId, empresaId } = input;
    await asegurarCliente(this.clienteRepo, clienteId, empresaId);

    const choferIds = [...new Set(input.choferIds)];
    const vehiculoIds = [...new Set(input.vehiculoIds)];

    const choferes = await this.choferRepo.findByIds(choferIds, empresaId);
    if (choferes.length !== choferIds.length) {
      throw new ApiError("Alguno de los choferes indicados no existe en esta empresa", Code.BAD_REQUEST);
    }
    const vehiculos = await this.vehiculoRepo.findByIds(vehiculoIds, empresaId);
    if (vehiculos.length !== vehiculoIds.length) {
      throw new ApiError("Alguno de los vehículos indicados no existe en esta empresa", Code.BAD_REQUEST);
    }

    await this.repo.setAutorizados(clienteId, empresaId, choferIds, vehiculoIds);
    return this.repo.getAutorizados(clienteId, empresaId);
  }
}
