import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Cuenta, CuentaNodo, construirArbolCuentas } from "@/modules/contabilidad/domain/cuenta";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";

export interface PlanDeCuentas {
  /** Árbol jerárquico, para la pantalla. */
  arbol: CuentaNodo[];
  /** Lista plana ordenada por código, para los selects de imputación. */
  cuentas: Cuenta[];
}

@injectable()
export class ListarPlanCuentas {
  constructor(@inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository) {}

  async execute(empresaId: string, incluirInactivas = true): Promise<PlanDeCuentas> {
    const cuentas = await this.cuentaRepository.list(empresaId, incluirInactivas);
    return { arbol: construirArbolCuentas(cuentas), cuentas };
  }
}
