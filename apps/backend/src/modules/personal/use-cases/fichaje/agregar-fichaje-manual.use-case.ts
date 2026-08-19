import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";
import { FichajeRepository } from "@/modules/personal/domain/fichaje.repository";
import { Fichaje, OrigenFichaje, TipoFichaje } from "@/modules/personal/domain/fichaje";

export interface AgregarFichajeManualInput {
  empresaId: string;
  empleadoId: string;
  momento: Date;
  tipo: TipoFichaje;
}

/**
 * Completa una marcación olvidada desde la vista de asistencia (ver
 * `docs/plan-personal-asistencia.md`, punto 7) — queda guardada con
 * `origen: "manual"`, lo que la vista de asistencia sigue mostrando como
 * rastro visible aunque el día ya no esté "incompleto".
 */
@injectable()
export class AgregarFichajeManual {
  constructor(
    @inject(DI_TYPES.FichajeRepository) private readonly fichajeRepository: FichajeRepository,
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: AgregarFichajeManualInput): Promise<Fichaje> {
    const empleado = await this.empleadoRepository.getById(input.empleadoId, input.empresaId);
    if (!empleado) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);

    const [fichaje] = await this.fichajeRepository.createMany([
      {
        empresaId: input.empresaId,
        empleadoId: input.empleadoId,
        momento: input.momento,
        tipo: input.tipo,
        origen: OrigenFichaje.MANUAL,
      },
    ]);
    if (!fichaje) throw new ApiError("No se pudo crear el fichaje", Code.INTERNAL_SERVER_ERROR);
    return fichaje;
  }
}
