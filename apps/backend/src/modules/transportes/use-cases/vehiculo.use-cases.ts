import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { normalizarPatente } from "@/modules/transportes/domain/documento-transporte";
import { errorDuplicado } from "@/modules/transportes/domain/duplicado";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { TransportistaRepository } from "@/modules/transportes/domain/transportista.repository";
import { Vehiculo } from "@/modules/transportes/domain/vehiculo";
import {
  CreateVehiculoInput,
  UpdateVehiculoInput,
  VehiculoRepository,
} from "@/modules/transportes/domain/vehiculo.repository";

async function asegurarPatenteLibre(
  repo: VehiculoRepository,
  empresaId: string,
  patente: string,
  propioId?: string,
): Promise<void> {
  const existente = await repo.findByPatente(empresaId, patente);
  if (existente && existente.id !== propioId) {
    throw errorDuplicado("un vehículo", "patente", patente, !existente.activo);
  }
}

async function asegurarTransportista(
  repo: TransportistaRepository,
  empresaId: string,
  transportistaId?: string,
): Promise<void> {
  if (!transportistaId) return;
  const transportista = await repo.getById(transportistaId, empresaId);
  if (!transportista) {
    throw new ApiError("El transportista indicado no existe en esta empresa", Code.BAD_REQUEST);
  }
}

@injectable()
export class CreateVehiculo {
  constructor(
    @inject(DI_TYPES.VehiculoRepository) private readonly repo: VehiculoRepository,
    @inject(DI_TYPES.TransportistaRepository)
    private readonly transportistaRepo: TransportistaRepository,
  ) {}

  async execute(input: CreateVehiculoInput): Promise<Vehiculo> {
    const patente = normalizarPatente(input.patente);
    await asegurarPatenteLibre(this.repo, input.empresaId, patente);
    await asegurarTransportista(this.transportistaRepo, input.empresaId, input.transportistaId);
    return this.repo.create({ ...input, patente });
  }
}

export interface ListVehiculosInput {
  empresaId: string;
  estado?: EstadoTransporteFiltro;
}

@injectable()
export class ListVehiculos {
  constructor(@inject(DI_TYPES.VehiculoRepository) private readonly repo: VehiculoRepository) {}

  execute(input: ListVehiculosInput): Promise<Vehiculo[]> {
    return this.repo.list(input.empresaId, input.estado);
  }
}

@injectable()
export class GetVehiculo {
  constructor(@inject(DI_TYPES.VehiculoRepository) private readonly repo: VehiculoRepository) {}

  async execute(input: { id: string; empresaId: string }): Promise<Vehiculo> {
    const vehiculo = await this.repo.getById(input.id, input.empresaId);
    if (!vehiculo) throw new ApiError("Vehículo no encontrado", Code.NOT_FOUND);
    return vehiculo;
  }
}

export type UpdateVehiculoUseCaseInput = UpdateVehiculoInput & { id: string; empresaId: string };

@injectable()
export class UpdateVehiculo {
  constructor(
    @inject(DI_TYPES.VehiculoRepository) private readonly repo: VehiculoRepository,
    @inject(DI_TYPES.TransportistaRepository)
    private readonly transportistaRepo: TransportistaRepository,
  ) {}

  async execute(input: UpdateVehiculoUseCaseInput): Promise<Vehiculo> {
    const { id, empresaId, ...rest } = input;
    const patente = normalizarPatente(rest.patente);
    await asegurarPatenteLibre(this.repo, empresaId, patente, id);
    await asegurarTransportista(this.transportistaRepo, empresaId, rest.transportistaId);
    return this.repo.update(id, empresaId, { ...rest, patente });
  }
}

@injectable()
export class DeleteVehiculo {
  constructor(@inject(DI_TYPES.VehiculoRepository) private readonly repo: VehiculoRepository) {}

  async execute(input: { id: string; empresaId: string }): Promise<void> {
    await this.repo.delete(input.id, input.empresaId);
  }
}

@injectable()
export class ReactivarVehiculo {
  constructor(@inject(DI_TYPES.VehiculoRepository) private readonly repo: VehiculoRepository) {}

  execute(input: { id: string; empresaId: string }): Promise<Vehiculo> {
    return this.repo.reactivar(input.id, input.empresaId);
  }
}
