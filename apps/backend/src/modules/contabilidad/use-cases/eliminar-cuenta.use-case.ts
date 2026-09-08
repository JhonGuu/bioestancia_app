import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";

export interface EliminarCuentaResultado {
  /** `true` si se borró de verdad; `false` si solo se desactivó. */
  eliminada: boolean;
  mensaje: string;
}

/**
 * Borra una cuenta si nunca se usó; si ya tiene movimientos la DESACTIVA en
 * vez de borrarla (borrarla dejaría huérfanas líneas de asientos ya
 * emitidos). Desactivada no se ofrece más para imputar, pero su historia
 * sigue apareciendo en el mayor.
 */
@injectable()
export class EliminarCuenta {
  constructor(@inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository) {}

  async execute(id: string, empresaId: string): Promise<EliminarCuentaResultado> {
    const cuenta = await this.cuentaRepository.getById(id, empresaId);
    if (!cuenta) throw new ApiError("La cuenta no existe", Code.NOT_FOUND);

    if (await this.cuentaRepository.tieneHijos(id)) {
      throw new ApiError(
        "La cuenta tiene cuentas hijas — borralas o movelas de lugar primero",
        Code.BAD_REQUEST,
      );
    }

    if (await this.cuentaRepository.tieneMovimientos(id)) {
      await this.cuentaRepository.desactivar(id, empresaId);
      return {
        eliminada: false,
        mensaje: `"${cuenta.codigo} ${cuenta.nombre}" tiene movimientos registrados, así que se desactivó en vez de borrarse`,
      };
    }

    await this.cuentaRepository.delete(id, empresaId);
    return { eliminada: true, mensaje: "Cuenta eliminada correctamente" };
  }
}
