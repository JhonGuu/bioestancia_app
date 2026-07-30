import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";

export interface ReabrirCompraInput {
  id: string;
  empresaId: string;
}

/**
 * Deshace el cierre de una compra: vuelve a `cerrada: false` y limpia
 * `fechaCierre`/`pesoFinalVenta`/`rinde`. Se usa para corregir algo (una
 * venta mal cargada, un dato general de la compra) y volver a cerrar
 * después con `CerrarCompra`.
 */
@injectable()
export class ReabrirCompra {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
  ) {}

  async execute(input: ReabrirCompraInput): Promise<Compra> {
    const compra = await this.compraRepository.getById(input.id, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    if (!compra.cerrada) {
      throw new ApiError("La compra no está cerrada", Code.BAD_REQUEST);
    }

    return this.compraRepository.reabrir(input.id, input.empresaId);
  }
}
