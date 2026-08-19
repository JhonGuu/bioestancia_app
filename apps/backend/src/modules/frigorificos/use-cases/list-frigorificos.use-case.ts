import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import {
  EstadoFrigorificoFiltro,
  FrigorificoRepository,
} from "@/modules/frigorificos/domain/frigorifico.repository";

export interface ListFrigorificosInput {
  empresaId: string;
  estado?: EstadoFrigorificoFiltro;
}

@injectable()
export class ListFrigorificos {
  constructor(
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: ListFrigorificosInput): Promise<Frigorifico[]> {
    return this.frigorificoRepository.list(input.empresaId, input.estado);
  }
}
