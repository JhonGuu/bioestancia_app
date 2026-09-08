import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  AUXILIARES_POR_EVENTO,
  EVENTOS_ASIENTO_LABELS,
  EXPRESIONES_POR_EVENTO,
  EventoAsiento,
  ReglaAsiento,
} from "@/modules/contabilidad/domain/regla-asiento";
import {
  CreateReglaAsientoInput,
  ReglaAsientoLineaInput,
  ReglaAsientoRepository,
  UpdateReglaAsientoInput,
} from "@/modules/contabilidad/domain/regla-asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";

/**
 * Valida que las líneas de una regla tengan sentido para su evento (al
 * menos una línea, `expresion`/`auxiliarResolver` son de los que ese evento
 * admite, la cuenta existe/es imputable/activa) — se reutiliza en alta y
 * edición.
 */
async function validarLineas(
  cuentaRepository: CuentaRepository,
  empresaId: string,
  evento: EventoAsiento,
  lineas: ReglaAsientoLineaInput[],
): Promise<void> {
  if (lineas.length === 0) {
    throw new ApiError("La regla necesita al menos una línea", Code.BAD_REQUEST);
  }

  const expresionesValidas = new Set<string>(EXPRESIONES_POR_EVENTO[evento]);
  const auxiliaresValidos = new Set<string>(AUXILIARES_POR_EVENTO[evento]);
  const cuentas = await cuentaRepository.list(empresaId);
  const cuentasPorId = new Map(cuentas.map((c) => [c.id, c]));

  for (const linea of lineas) {
    if (!expresionesValidas.has(linea.expresion)) {
      throw new ApiError(
        `"${linea.expresion}" no es un importe válido para el evento "${EVENTOS_ASIENTO_LABELS[evento]}"`,
        Code.BAD_REQUEST,
      );
    }
    if (linea.auxiliarResolver && !auxiliaresValidos.has(linea.auxiliarResolver)) {
      throw new ApiError(
        `"${linea.auxiliarResolver}" no es un auxiliar válido para el evento "${EVENTOS_ASIENTO_LABELS[evento]}"`,
        Code.BAD_REQUEST,
      );
    }
    const cuenta = cuentasPorId.get(linea.cuentaId);
    if (!cuenta) {
      throw new ApiError("Una de las cuentas de la regla no existe", Code.BAD_REQUEST);
    }
    if (!cuenta.imputable || !cuenta.activa) {
      throw new ApiError(
        `"${cuenta.nombre}" no es una cuenta imputable/activa — no se le pueden cargar movimientos`,
        Code.BAD_REQUEST,
      );
    }
    // No se exige acá que `auxiliarResolver` esté seteado cuando `cuenta.requiereAuxiliar !== NINGUNO`:
    // si falta, la generación automática simplemente omite esa línea puntual (ver `evaluar-regla-asiento.ts`)
    // y lo reporta como advertencia — no bloquea la configuración de la regla en sí.
  }
}

@injectable()
export class ListarReglasAsiento {
  constructor(@inject(DI_TYPES.ReglaAsientoRepository) private readonly repository: ReglaAsientoRepository) {}

  async execute(empresaId: string): Promise<ReglaAsiento[]> {
    return this.repository.list(empresaId);
  }
}

@injectable()
export class CrearReglaAsiento {
  constructor(
    @inject(DI_TYPES.ReglaAsientoRepository) private readonly repository: ReglaAsientoRepository,
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
  ) {}

  async execute(input: CreateReglaAsientoInput): Promise<ReglaAsiento> {
    await validarLineas(this.cuentaRepository, input.empresaId, input.evento, input.lineas);
    return this.repository.create(input);
  }
}

@injectable()
export class ActualizarReglaAsiento {
  constructor(
    @inject(DI_TYPES.ReglaAsientoRepository) private readonly repository: ReglaAsientoRepository,
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
  ) {}

  async execute(id: string, empresaId: string, input: UpdateReglaAsientoInput): Promise<ReglaAsiento> {
    const regla = await this.repository.getById(id, empresaId);
    if (!regla) throw new ApiError("La regla de asiento no existe", Code.NOT_FOUND);

    if (input.lineas) {
      await validarLineas(this.cuentaRepository, empresaId, regla.evento, input.lineas);
    }

    return this.repository.update(id, empresaId, input);
  }
}

@injectable()
export class EliminarReglaAsiento {
  constructor(@inject(DI_TYPES.ReglaAsientoRepository) private readonly repository: ReglaAsientoRepository) {}

  async execute(id: string, empresaId: string): Promise<void> {
    const regla = await this.repository.getById(id, empresaId);
    if (!regla) throw new ApiError("La regla de asiento no existe", Code.NOT_FOUND);
    await this.repository.delete(id, empresaId);
  }
}
