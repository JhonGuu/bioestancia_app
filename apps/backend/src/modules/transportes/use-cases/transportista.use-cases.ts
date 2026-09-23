import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { errorDuplicado } from "@/modules/transportes/domain/duplicado";
import { normalizarCuit } from "@/modules/transportes/domain/documento-transporte";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { Transportista } from "@/modules/transportes/domain/transportista";
import {
  CreateTransportistaInput,
  TransportistaRepository,
  UpdateTransportistaInput,
} from "@/modules/transportes/domain/transportista.repository";

async function asegurarCuitLibre(
  repo: TransportistaRepository,
  empresaId: string,
  cuit: string,
  propioId?: string,
): Promise<void> {
  const existente = await repo.findByCuit(empresaId, cuit);
  if (existente && existente.id !== propioId) {
    throw errorDuplicado("un transportista", "CUIT", cuit, !existente.activo);
  }
}

@injectable()
export class CreateTransportista {
  constructor(
    @inject(DI_TYPES.TransportistaRepository) private readonly repo: TransportistaRepository,
  ) {}

  async execute(input: CreateTransportistaInput): Promise<Transportista> {
    const cuit = normalizarCuit(input.cuit);
    await asegurarCuitLibre(this.repo, input.empresaId, cuit);
    return this.repo.create({ ...input, cuit, nombre: input.nombre.trim() });
  }
}

export interface ListTransportistasInput {
  empresaId: string;
  estado?: EstadoTransporteFiltro;
}

@injectable()
export class ListTransportistas {
  constructor(
    @inject(DI_TYPES.TransportistaRepository) private readonly repo: TransportistaRepository,
  ) {}

  execute(input: ListTransportistasInput): Promise<Transportista[]> {
    return this.repo.list(input.empresaId, input.estado);
  }
}

@injectable()
export class GetTransportista {
  constructor(
    @inject(DI_TYPES.TransportistaRepository) private readonly repo: TransportistaRepository,
  ) {}

  async execute(input: { id: string; empresaId: string }): Promise<Transportista> {
    const transportista = await this.repo.getById(input.id, input.empresaId);
    if (!transportista) throw new ApiError("Transportista no encontrado", Code.NOT_FOUND);
    return transportista;
  }
}

export type UpdateTransportistaUseCaseInput = UpdateTransportistaInput & {
  id: string;
  empresaId: string;
};

@injectable()
export class UpdateTransportista {
  constructor(
    @inject(DI_TYPES.TransportistaRepository) private readonly repo: TransportistaRepository,
  ) {}

  async execute(input: UpdateTransportistaUseCaseInput): Promise<Transportista> {
    const { id, empresaId, ...rest } = input;
    const cuit = normalizarCuit(rest.cuit);
    await asegurarCuitLibre(this.repo, empresaId, cuit, id);
    return this.repo.update(id, empresaId, { ...rest, cuit, nombre: rest.nombre.trim() });
  }
}

@injectable()
export class DeleteTransportista {
  constructor(
    @inject(DI_TYPES.TransportistaRepository) private readonly repo: TransportistaRepository,
  ) {}

  async execute(input: { id: string; empresaId: string }): Promise<void> {
    await this.repo.delete(input.id, input.empresaId);
  }
}

@injectable()
export class ReactivarTransportista {
  constructor(
    @inject(DI_TYPES.TransportistaRepository) private readonly repo: TransportistaRepository,
  ) {}

  execute(input: { id: string; empresaId: string }): Promise<Transportista> {
    return this.repo.reactivar(input.id, input.empresaId);
  }
}
