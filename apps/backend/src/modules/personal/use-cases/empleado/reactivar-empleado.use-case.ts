import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Empleado } from "@/modules/personal/domain/empleado";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

export interface ReactivarEmpleadoInput {
  id: string;
  empresaId: string;
}

@injectable()
export class ReactivarEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: ReactivarEmpleadoInput): Promise<Empleado> {
    return this.empleadoRepository.reactivar(input.id, input.empresaId);
  }
}
