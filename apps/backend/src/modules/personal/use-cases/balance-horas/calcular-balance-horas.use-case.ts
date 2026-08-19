import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";
import { CargoRepository } from "@/modules/personal/domain/cargo.repository";
import { HorarioEmpleadoRepository } from "@/modules/personal/domain/horario-empleado.repository";
import { FichajeRepository } from "@/modules/personal/domain/fichaje.repository";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { calcularJornadasEmpleado } from "@/modules/personal/domain/calcular-jornada";
import { calcularRangoPeriodo } from "@/modules/personal/domain/calcular-rango-periodo";
import { agregarBalanceEmpleado } from "@/modules/personal/domain/agregar-balance-empleado";
import { BalanceHoras, PeriodoBalance } from "@/modules/personal/domain/balance-horas";
import { Fichaje } from "@/modules/personal/domain/fichaje";

export interface CalcularBalanceHorasInput {
  empresaId: string;
  periodo: PeriodoBalance;
  /** Cualquier fecha dentro del período que se quiere ver — se usa para calcular el rango. */
  fechaReferencia: Date;
}

/**
 * Compone el balance de horas extra de TODOS los empleados activos en un
 * período elegido (semanal/quincenal/mensual) — el reemplazo de la hoja
 * "RECUENTO DE HORAS" (ver `docs/plan-personal-asistencia.md`, punto 8).
 *
 * Reutiliza el mismo cálculo puro que `CalcularJornadasEmpleado`
 * (`calcularJornadasEmpleado`), pero corrido para cada empleado y sumado.
 */
@injectable()
export class CalcularBalanceHoras {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
    @inject(DI_TYPES.CargoRepository) private readonly cargoRepository: CargoRepository,
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
    @inject(DI_TYPES.HorarioEmpleadoRepository)
    private readonly horarioEmpleadoRepository: HorarioEmpleadoRepository,
    @inject(DI_TYPES.FichajeRepository) private readonly fichajeRepository: FichajeRepository,
  ) {}

  async execute(input: CalcularBalanceHorasInput): Promise<BalanceHoras> {
    const { desde, hasta } = calcularRangoPeriodo(input.periodo, input.fechaReferencia);
    const desdeDate = new Date(`${desde}T00:00:00.000Z`);
    const hastaDate = new Date(`${hasta}T00:00:00.000Z`);
    const finRangoFichajes = new Date(`${hasta}T23:59:59.999Z`);

    const [empleados, cargos, empresa] = await Promise.all([
      this.empleadoRepository.list(input.empresaId, "activos"),
      this.cargoRepository.list(input.empresaId, "todos"),
      this.empresaRepository.getById(input.empresaId),
    ]);

    const cargoPorId = new Map(cargos.map((c) => [c.id, c]));
    const empleadoIds = empleados.map((e) => e.id);

    const [fichajes, horariosPorEmpleado] = await Promise.all([
      this.fichajeRepository.listByEmpleadosEnRango(empleadoIds, desdeDate, finRangoFichajes),
      Promise.all(empleados.map((e) => this.horarioEmpleadoRepository.listByEmpleado(e.id))),
    ]);

    const fichajesPorEmpleado = new Map<string, Fichaje[]>();
    for (const fichaje of fichajes) {
      const lista = fichajesPorEmpleado.get(fichaje.empleadoId) ?? [];
      lista.push(fichaje);
      fichajesPorEmpleado.set(fichaje.empleadoId, lista);
    }

    const empleadosBalance = empleados.map((empleado, indice) => {
      const cargo = empleado.cargoId ? (cargoPorId.get(empleado.cargoId) ?? null) : null;
      const toleranciaMinutos =
        empleado.toleranciaMinutos ?? cargo?.toleranciaMinutos ?? empresa?.toleranciaTardanzaMinutos ?? 0;

      const jornadas = calcularJornadasEmpleado({
        empleadoId: empleado.id,
        desde: desdeDate,
        hasta: hastaDate,
        fichajes: fichajesPorEmpleado.get(empleado.id) ?? [],
        horarios: horariosPorEmpleado[indice],
        toleranciaMinutos,
      });

      return agregarBalanceEmpleado(
        empleado.id,
        `${empleado.apellido}, ${empleado.nombre}`,
        cargo?.nombre ?? null,
        jornadas,
      );
    });

    return { periodo: input.periodo, desde, hasta, empleados: empleadosBalance };
  }
}
