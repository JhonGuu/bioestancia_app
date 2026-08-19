import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";
import { CreateFichajeInput, FichajeRepository } from "@/modules/personal/domain/fichaje.repository";
import { OrigenFichaje } from "@/modules/personal/domain/fichaje";
import {
  DEDUPE_VENTANA_MINUTOS,
  filtrarDuplicados,
  MarcacionParaDedupe,
} from "@/modules/personal/domain/fichaje-dedupe";
import {
  AliasDispositivoConfirmar,
  FilaFichajeConfirmar,
  ResultadoConfirmarImportacion,
} from "@/modules/personal/domain/fichaje-import";

export interface ConfirmarImportacionFichajesInput {
  empresaId: string;
  filas: FilaFichajeConfirmar[];
  alias?: AliasDispositivoConfirmar[];
}

type MarcacionCandidata = MarcacionParaDedupe & { input: CreateFichajeInput | null };

/**
 * Segundo paso de la importación (ver `docs/plan-personal-asistencia.md`,
 * punto 6): recibe las filas ya resueltas (matcheadas automáticamente por
 * `PrevisualizarImportacionFichajes`, más las que el usuario asignó a mano),
 * opcionalmente guarda el alias de dispositivo para la próxima vez, y
 * dedupea contra lo que ya está en la base antes de insertar — así
 * reimportar el mismo archivo por error no duplica marcaciones.
 */
@injectable()
export class ConfirmarImportacionFichajes {
  constructor(
    @inject(DI_TYPES.FichajeRepository) private readonly fichajeRepository: FichajeRepository,
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
  ) {}

  async execute(input: ConfirmarImportacionFichajesInput): Promise<ResultadoConfirmarImportacion> {
    if (input.filas.length === 0) return { importados: 0, omitidosPorDuplicado: 0 };

    for (const alias of input.alias ?? []) {
      await this.empleadoRepository.setNombreDispositivo(alias.empleadoId, input.empresaId, alias.nombreDispositivo);
    }

    const empleadoIds = [...new Set(input.filas.map((f) => f.empleadoId))];
    const momentos = input.filas.map((f) => f.momento.getTime());
    const ventanaMs = DEDUPE_VENTANA_MINUTOS * 60 * 1000;
    const desde = new Date(Math.min(...momentos) - ventanaMs);
    const hasta = new Date(Math.max(...momentos) + ventanaMs);

    const existentes = await this.fichajeRepository.listByEmpleadosEnRango(empleadoIds, desde, hasta);

    const candidatas: MarcacionCandidata[] = [
      ...existentes.map((f): MarcacionCandidata => ({
        grupo: `${f.empleadoId}:${f.tipo}`,
        momento: f.momento,
        esExistente: true,
        input: null,
      })),
      ...input.filas.map((f): MarcacionCandidata => ({
        grupo: `${f.empleadoId}:${f.tipo}`,
        momento: f.momento,
        esExistente: false,
        input: {
          empresaId: input.empresaId,
          empleadoId: f.empleadoId,
          momento: f.momento,
          tipo: f.tipo,
          origen: OrigenFichaje.IMPORTADO,
        },
      })),
    ];

    const { conservadas, descartadas } = filtrarDuplicados(candidatas);
    const inputsInsert = conservadas
      .map((m) => m.input)
      .filter((i): i is CreateFichajeInput => i !== null);

    await this.fichajeRepository.createMany(inputsInsert);

    return {
      importados: inputsInsert.length,
      omitidosPorDuplicado: descartadas.filter((m) => m.input !== null).length,
    };
  }
}
