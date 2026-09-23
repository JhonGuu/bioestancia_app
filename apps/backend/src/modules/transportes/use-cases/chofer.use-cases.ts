import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Chofer } from "@/modules/transportes/domain/chofer";
import {
  ChoferRepository,
  CreateChoferInput,
  UpdateChoferInput,
} from "@/modules/transportes/domain/chofer.repository";
import { errorDuplicado } from "@/modules/transportes/domain/duplicado";
import { normalizarCuit } from "@/modules/transportes/domain/documento-transporte";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { TransportistaRepository } from "@/modules/transportes/domain/transportista.repository";

async function asegurarCuitLibre(
  repo: ChoferRepository,
  empresaId: string,
  cuit: string,
  propioId?: string,
): Promise<void> {
  const existente = await repo.findByCuit(empresaId, cuit);
  if (existente && existente.id !== propioId) {
    throw errorDuplicado("un chofer", "CUIT", cuit, !existente.activo);
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
export class CreateChofer {
  constructor(
    @inject(DI_TYPES.ChoferRepository) private readonly repo: ChoferRepository,
    @inject(DI_TYPES.TransportistaRepository)
    private readonly transportistaRepo: TransportistaRepository,
  ) {}

  async execute(input: CreateChoferInput): Promise<Chofer> {
    const cuit = normalizarCuit(input.cuit);
    await asegurarCuitLibre(this.repo, input.empresaId, cuit);
    await asegurarTransportista(this.transportistaRepo, input.empresaId, input.transportistaId);
    return this.repo.create({
      ...input,
      cuit,
      nombre: input.nombre.trim(),
      apellido: input.apellido.trim(),
    });
  }
}

export interface ListChoferesInput {
  empresaId: string;
  estado?: EstadoTransporteFiltro;
}

@injectable()
export class ListChoferes {
  constructor(@inject(DI_TYPES.ChoferRepository) private readonly repo: ChoferRepository) {}

  execute(input: ListChoferesInput): Promise<Chofer[]> {
    return this.repo.list(input.empresaId, input.estado);
  }
}

@injectable()
export class GetChofer {
  constructor(@inject(DI_TYPES.ChoferRepository) private readonly repo: ChoferRepository) {}

  async execute(input: { id: string; empresaId: string }): Promise<Chofer> {
    const chofer = await this.repo.getById(input.id, input.empresaId);
    if (!chofer) throw new ApiError("Chofer no encontrado", Code.NOT_FOUND);
    return chofer;
  }
}

export type UpdateChoferUseCaseInput = UpdateChoferInput & {
  id: string;
  empresaId: string;
  /**
   * Si quien edita NO tiene el permiso para ver datos personales, el DNI y la
   * licencia que vienen en el pedido se ignoran y se conservan los guardados:
   * como no los ve, la pantalla los manda vacíos y editar el nombre no debe
   * borrarlos.
   */
  puedeVerDatosPersonales: boolean;
};

@injectable()
export class UpdateChofer {
  constructor(
    @inject(DI_TYPES.ChoferRepository) private readonly repo: ChoferRepository,
    @inject(DI_TYPES.TransportistaRepository)
    private readonly transportistaRepo: TransportistaRepository,
  ) {}

  async execute(input: UpdateChoferUseCaseInput): Promise<Chofer> {
    const { id, empresaId, puedeVerDatosPersonales, ...rest } = input;
    const cuit = normalizarCuit(rest.cuit);
    await asegurarCuitLibre(this.repo, empresaId, cuit, id);
    await asegurarTransportista(this.transportistaRepo, empresaId, rest.transportistaId);

    let dni = rest.dni;
    let licenciaVencimiento = rest.licenciaVencimiento;
    if (!puedeVerDatosPersonales) {
      const existente = await this.repo.getById(id, empresaId);
      if (!existente) throw new ApiError("Chofer no encontrado", Code.NOT_FOUND);
      dni = existente.dni ?? undefined;
      licenciaVencimiento = existente.licenciaVencimiento ?? undefined;
    }

    return this.repo.update(id, empresaId, {
      ...rest,
      cuit,
      nombre: rest.nombre.trim(),
      apellido: rest.apellido.trim(),
      dni,
      licenciaVencimiento,
    });
  }
}

@injectable()
export class DeleteChofer {
  constructor(@inject(DI_TYPES.ChoferRepository) private readonly repo: ChoferRepository) {}

  async execute(input: { id: string; empresaId: string }): Promise<void> {
    await this.repo.delete(input.id, input.empresaId);
  }
}

@injectable()
export class ReactivarChofer {
  constructor(@inject(DI_TYPES.ChoferRepository) private readonly repo: ChoferRepository) {}

  execute(input: { id: string; empresaId: string }): Promise<Chofer> {
    return this.repo.reactivar(input.id, input.empresaId);
  }
}
