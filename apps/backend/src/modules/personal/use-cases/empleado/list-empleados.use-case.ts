import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Empleado } from "@/modules/personal/domain/empleado";
import { EmpleadoRepository, EstadoEmpleadoFiltro } from "@/modules/personal/domain/empleado.repository";

export interface ListEmpleadosInput {
  empresaId: string;
  estado?: EstadoEmpleadoFiltro;
}

@injectable()
export class ListEmpleados {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: ListEmpleadosInput): Promise<Empleado[]> {
    return this.empleadoRepository.list(input.empresaId, input.estado);
  }
}
