import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Empleado } from "@/modules/personal/domain/empleado";
import { EmpleadoRepository, UpdateEmpleadoInput } from "@/modules/personal/domain/empleado.repository";

export type UpdateEmpleadoUseCaseInput = UpdateEmpleadoInput & { id: string; empresaId: string };

@injectable()
export class UpdateEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: UpdateEmpleadoUseCaseInput): Promise<Empleado> {
    const { id, empresaId, ...rest } = input;
    return this.empleadoRepository.update(id, empresaId, rest);
  }
}
