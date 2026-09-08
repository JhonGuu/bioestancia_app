import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

export interface CrearCuentaInput {
  empresaId: string;
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  parentId?: string | null;
  imputable: boolean;
  monetaria: boolean;
  requiereAuxiliar?: TipoAuxiliar;
}

@injectable()
export class CrearCuenta {
  constructor(@inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository) {}

  async execute(input: CrearCuentaInput): Promise<Cuenta> {
    const existente = await this.cuentaRepository.getByCodigo(input.codigo, input.empresaId);
    if (existente) {
      throw new ApiError(`Ya existe una cuenta con el código ${input.codigo}`, Code.BAD_REQUEST);
    }

    if (input.parentId) {
      const padre = await this.cuentaRepository.getById(input.parentId, input.empresaId);
      if (!padre) {
        throw new ApiError("La cuenta padre no existe (o no es de esta empresa)", Code.BAD_REQUEST);
      }
      // Colgar una cuenta de una imputable rompería el mayor: el saldo del
      // padre dejaría de ser la suma de sus hijas.
      if (padre.imputable) {
        throw new ApiError(
          `"${padre.codigo} ${padre.nombre}" es una cuenta imputable — para colgarle cuentas hijas, primero pasala a cuenta de agrupación`,
          Code.BAD_REQUEST,
        );
      }
      if (padre.tipo !== input.tipo) {
        throw new ApiError(
          `La cuenta tiene que ser del mismo tipo que su padre (${padre.tipo})`,
          Code.BAD_REQUEST,
        );
      }
    }

    return this.cuentaRepository.create(input);
  }
}
