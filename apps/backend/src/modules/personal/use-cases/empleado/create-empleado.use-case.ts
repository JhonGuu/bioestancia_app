import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Empleado } from "@/modules/personal/domain/empleado";
import { CreateEmpleadoInput, EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

@injectable()
export class CreateEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: CreateEmpleadoInput): Promise<Empleado> {
    return this.empleadoRepository.create(input);
  }
}
