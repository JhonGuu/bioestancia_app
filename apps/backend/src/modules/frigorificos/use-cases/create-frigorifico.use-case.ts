import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import {
  CreateFrigorificoInput,
  FrigorificoRepository,
} from "@/modules/frigorificos/domain/frigorifico.repository";

@injectable()
export class CreateFrigorifico {
  constructor(
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: CreateFrigorificoInput): Promise<Frigorifico> {
    return this.frigorificoRepository.create(input);
  }
}
