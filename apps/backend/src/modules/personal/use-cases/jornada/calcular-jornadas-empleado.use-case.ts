import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";
import { CargoRepository } from "@/modules/personal/domain/cargo.repository";
import { HorarioEmpleadoRepository } from "@/modules/personal/domain/horario-empleado.repository";
import { FichajeRepository } from "@/modules/personal/domain/fichaje.repository";
import { calcularJornadasEmpleado } from "@/modules/personal/domain/calcular-jornada";
import { Jornada } from "@/modules/personal/domain/jornada";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";

export interface CalcularJornadasEmpleadoInput {
  empresaId: string;
  empleadoId: string;
  /** Inclusive. */
  desde: Date;
  /** Inclusive. */
  hasta: Date;
}

/**
 * Trae todo lo necesario (empleado, cargo, empresa, horario pactado,
 * fichajes del rango), resuelve la cascada de tolerancia de tardanza
 * (empleado → cargo → empresa, ver `docs/plan-personal-asistencia.md` punto
 * 3) y delega el cálculo puro a `calcularJornadasEmpleado`.
 */
@injectable()
export class CalcularJornadasEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
    @inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository,
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
    @inject(DI_TYPES.HorarioEmpleadoRepository)
    private readonly horarioEmpleadoRepository: HorarioEmpleadoRepository,
    @inject(DI_TYPES.FichajeRepository) private readonly fichajeRepository: FichajeRepository,
  ) {}

  async execute(input: CalcularJornadasEmpleadoInput): Promise<Jornada[]> {
    const empleado = await this.empleadoRepository.getById(input.empleadoId, input.empresaId);
    if (!empleado) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);

    const finRango = new Date(input.hasta);
    finRango.setUTCHours(23, 59, 59, 999);

    const [cargo, empresa, horarios, fichajes] = await Promise.all([
      empleado.cargoId ? this.cargoRepository.getById(empleado.cargoId, input.empresaId) : null,
      this.empresaRepository.getById(input.empresaId),
      this.horarioEmpleadoRepository.listByEmpleado(input.empleadoId),
      this.fichajeRepository.listByEmpleadosEnRango([input.empleadoId], input.desde, finRango),
    ]);

    const toleranciaMinutos =
      empleado.toleranciaMinutos ?? cargo?.toleranciaMinutos ?? empresa?.toleranciaTardanzaMinutos ?? 0;

    return calcularJornadasEmpleado({
      empleadoId: input.empleadoId,
      desde: input.desde,
      hasta: input.hasta,
      fichajes,
      horarios,
      toleranciaMinutos,
    });
  }
}
