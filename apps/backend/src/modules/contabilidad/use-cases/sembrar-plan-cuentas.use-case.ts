import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { CuentaRepository, CreateCuentaInput } from "@/modules/contabilidad/domain/cuenta.repository";
import { CuentaBase, PLAN_CUENTAS_BASE, codigoPadre } from "@/modules/contabilidad/domain/plan-cuentas-base";

export interface SembrarPlanCuentasResultado {
  creadas: number;
  omitidas: number;
}

/**
 * Siembra el plan de cuentas base en una empresa. Es el punto de partida:
 * después se edita todo desde la app.
 *
 * Se inserta nivel por nivel (primero "1", después "1.1", después
 * "1.1.01"...) porque cada cuenta necesita el `id` de su padre, que se
 * deduce del código (ver `codigoPadre`).
 *
 * Nunca duplica ni borra: las cuentas cuyo código ya existe se saltean. Por
 * eso `forzar` sirve para COMPLETAR un plan al que le falten cuentas del
 * catálogo base, no para reemplazarlo.
 */
@injectable()
export class SembrarPlanCuentas {
  constructor(
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(empresaId: string, forzar = false): Promise<SembrarPlanCuentasResultado> {
    const existentes = await this.cuentaRepository.list(empresaId);
    if (existentes.length > 0 && !forzar) {
      throw new ApiError(
        `Esta empresa ya tiene ${existentes.length} cuentas cargadas. Si querés completar las que falten del plan base, volvé a pedirlo con "forzar" — no se borra ni se pisa nada de lo que ya tenés.`,
        Code.BAD_REQUEST,
      );
    }

    const idsPorCodigo = new Map(existentes.map((cuenta) => [cuenta.codigo, cuenta.id]));

    const porNivel = new Map<number, CuentaBase[]>();
    for (const base of PLAN_CUENTAS_BASE) {
      if (idsPorCodigo.has(base.codigo)) continue;
      const nivel = base.codigo.split(".").length;
      porNivel.set(nivel, [...(porNivel.get(nivel) ?? []), base]);
    }

    let creadas = 0;
    for (const nivel of [...porNivel.keys()].sort((a, b) => a - b)) {
      const delNivel = porNivel.get(nivel) ?? [];
      const inputs: CreateCuentaInput[] = delNivel.map((base) => {
        const padre = codigoPadre(base.codigo);
        return {
          empresaId,
          codigo: base.codigo,
          nombre: base.nombre,
          tipo: base.tipo,
          parentId: padre ? (idsPorCodigo.get(padre) ?? null) : null,
          imputable: base.imputable,
          monetaria: base.monetaria,
          requiereAuxiliar: base.requiereAuxiliar,
        };
      });

      const creadasDelNivel = await this.cuentaRepository.createMany(inputs);
      for (const cuenta of creadasDelNivel) idsPorCodigo.set(cuenta.codigo, cuenta.id);
      creadas += creadasDelNivel.length;
    }

    this.logger.info({ empresaId, creadas }, "Plan de cuentas base sembrado");
    return { creadas, omitidas: PLAN_CUENTAS_BASE.length - creadas };
  }
}
