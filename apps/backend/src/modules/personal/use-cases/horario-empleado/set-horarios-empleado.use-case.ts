import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { HorarioEmpleado } from "@/modules/personal/domain/horario-empleado";
import {
  HorarioEmpleadoRepository,
  SetHorarioInput,
} from "@/modules/personal/domain/horario-empleado.repository";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

export interface SetHorariosEmpleadoInput {
  empleadoId: string;
  empresaId: string;
  horarios: SetHorarioInput[];
}

/**
 * Normaliza a "HH:mm" (dos dígitos de hora, sin segundos) una hora que puede
 * venir en varios formatos — según la configuración regional del SO, algunos
 * navegadores devuelven `<input type="time">.value` como "8:00" (sin cero
 * adelante) o "08:00:00" (con un tercer segmento de segundos que ni
 * siquiera se ve en el control). La validación ya acepta esas variantes
 * (ver `empleado.validation.ts`); acá se recorta antes de guardar para que
 * quede consistente en la base.
 */
function normalizarHora(hora: string | null): string | null {
  if (!hora) return hora;
  const [horaParte, minutoParte] = hora.split(":");
  return `${horaParte.padStart(2, "0")}:${(minutoParte ?? "00").padStart(2, "0")}`;
}

/**
 * Reemplaza el horario semanal completo de un empleado (ver
 * `HorarioEmpleadoRepository.setHorarios`) — se configura una vez y se
 * edita solo cuando cambia el pacto real.
 */
@injectable()
export class SetHorariosEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
    @inject(DI_TYPES.HorarioEmpleadoRepository)
    private readonly horarioEmpleadoRepository: HorarioEmpleadoRepository,
  ) {}

  async execute(input: SetHorariosEmpleadoInput): Promise<HorarioEmpleado[]> {
    const empleado = await this.empleadoRepository.getById(input.empleadoId, input.empresaId);
    if (!empleado) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);
    const horarios = input.horarios.map((h) => ({
      ...h,
      horaEntrada: normalizarHora(h.horaEntrada),
      horaSalida: normalizarHora(h.horaSalida),
    }));
    return this.horarioEmpleadoRepository.setHorarios(input.empleadoId, horarios);
  }
}
