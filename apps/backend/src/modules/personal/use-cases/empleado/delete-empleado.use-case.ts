import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

export interface DeleteEmpleadoInput {
  id: string;
  empresaId: string;
}

@injectable()
export class DeleteEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: DeleteEmpleadoInput): Promise<void> {
    await this.empleadoRepository.delete(input.id, input.empresaId);
  }
}
