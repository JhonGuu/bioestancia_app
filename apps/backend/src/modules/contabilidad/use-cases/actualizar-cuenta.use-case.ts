import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import { CuentaRepository, UpdateCuentaInput } from "@/modules/contabilidad/domain/cuenta.repository";

/**
 * Edición de una cuenta. Casi todo se puede cambiar (es el plan de cuentas
 * del usuario, no uno cerrado), con dos frenos que protegen la integridad
 * de lo ya registrado:
 *
 *  - No se puede pasar de imputable a agrupación si ya tiene movimientos.
 *  - No se puede cambiar el tipo (activo/pasivo/resultado) si ya tiene
 *    movimientos: cambiaría el signo de informes ya emitidos.
 */
@injectable()
export class ActualizarCuenta {
  constructor(@inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository) {}

  async execute(id: string, empresaId: string, input: UpdateCuentaInput): Promise<Cuenta> {
    const cuenta = await this.cuentaRepository.getById(id, empresaId);
    if (!cuenta) throw new ApiError("La cuenta no existe", Code.NOT_FOUND);

    if (input.codigo && input.codigo !== cuenta.codigo) {
      const existente = await this.cuentaRepository.getByCodigo(input.codigo, empresaId);
      if (existente) {
        throw new ApiError(`Ya existe una cuenta con el código ${input.codigo}`, Code.BAD_REQUEST);
      }
    }

    if (input.parentId === id) {
      throw new ApiError("Una cuenta no puede ser su propio padre", Code.BAD_REQUEST);
    }

    const cambiaAAgrupacion = input.imputable === false && cuenta.imputable;
    const cambiaTipo = input.tipo !== undefined && input.tipo !== cuenta.tipo;

    if (cambiaAAgrupacion || cambiaTipo) {
      const tieneMovimientos = await this.cuentaRepository.tieneMovimientos(id);
      if (tieneMovimientos && cambiaAAgrupacion) {
        throw new ApiError(
          "La cuenta ya tiene movimientos: no se puede convertir en cuenta de agrupación",
          Code.BAD_REQUEST,
        );
      }
      if (tieneMovimientos && cambiaTipo) {
        throw new ApiError(
          "La cuenta ya tiene movimientos: cambiarle el tipo alteraría informes ya emitidos",
          Code.BAD_REQUEST,
        );
      }
    }

    return this.cuentaRepository.update(id, empresaId, input);
  }
}
