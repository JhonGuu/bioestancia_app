import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";

export interface ReabrirCompraInput {
  id: string;
  empresaId: string;
}

/**
 * Deshace el cierre de una compra: vuelve a `cerrada: false` y limpia
 * `fechaCierre`/`pesoFinalVenta`/`rinde`/`alertaSuperavit`. Se usa para
 * corregir algo (una venta mal cargada, un dato general de la compra) y
 * volver a cerrar después con `CerrarCompra`.
 *
 * Si la compra pertenece a un grupo de tropas CERRADO, se rechaza el
 * reabrir individual — hay que reabrir el grupo completo (`ReabrirGrupoTropas`),
 * que reabre todas sus tropas miembro a la vez.
 */
@injectable()
export class ReabrirCompra {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.GrupoTropasRepository) private readonly grupoTropasRepository: GrupoTropasRepository,
  ) {}

  async execute(input: ReabrirCompraInput): Promise<Compra> {
    const compra = await this.compraRepository.getById(input.id, input.empresaId);
    if (!compra) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    if (!compra.cerrada) {
      throw new ApiError("La compra no está cerrada", Code.BAD_REQUEST);
    }
    if (compra.grupoTropasId !== null) {
      const grupo = await this.grupoTropasRepository.getById(compra.grupoTropasId, input.empresaId);
      if (grupo && grupo.cerrado) {
        throw new ApiError(
          "Esta tropa pertenece a un grupo de tropas cerrado — reabrí el grupo completo.",
          Code.BAD_REQUEST,
        );
      }
    }

    return this.compraRepository.reabrir(input.id, input.empresaId);
  }
}
