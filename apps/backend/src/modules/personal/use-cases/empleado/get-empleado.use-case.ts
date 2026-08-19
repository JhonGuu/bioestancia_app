import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Empleado } from "@/modules/personal/domain/empleado";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

export interface GetEmpleadoInput {
  id: string;
  empresaId: string;
}

@injectable()
export class GetEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: GetEmpleadoInput): Promise<Empleado> {
    const empleado = await this.empleadoRepository.getById(input.id, input.empresaId);
    if (!empleado) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);
    return empleado;
  }
}
