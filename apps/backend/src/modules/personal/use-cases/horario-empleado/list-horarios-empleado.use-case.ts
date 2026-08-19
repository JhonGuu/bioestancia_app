import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { HorarioEmpleado } from "@/modules/personal/domain/horario-empleado";
import { HorarioEmpleadoRepository } from "@/modules/personal/domain/horario-empleado.repository";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

export interface ListHorariosEmpleadoInput {
  empleadoId: string;
  empresaId: string;
}

@injectable()
export class ListHorariosEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
    @inject(DI_TYPES.HorarioEmpleadoRepository)
    private readonly horarioEmpleadoRepository: HorarioEmpleadoRepository,
  ) {}

  async execute(input: ListHorariosEmpleadoInput): Promise<HorarioEmpleado[]> {
    // Valida que el empleado exista y sea de esta empresa antes de exponer sus horarios.
    const empleado = await this.empleadoRepository.getById(input.empleadoId, input.empresaId);
    if (!empleado) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);
    return this.horarioEmpleadoRepository.listByEmpleado(input.empleadoId);
  }
}
