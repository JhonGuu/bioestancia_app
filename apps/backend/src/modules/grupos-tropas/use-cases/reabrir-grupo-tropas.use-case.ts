import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";

export interface ReabrirGrupoTropasInput {
  id: string;
  empresaId: string;
}

export interface GrupoTropasConMiembros extends GrupoTropas {
  compras: Compra[];
}

/**
 * Deshace el cierre de un `GrupoTropas` y de TODAS sus tropas miembro (vuelve
 * a `cerrada: false` en cada una, limpiando `pesoFinalVenta`/`rinde`/
 * `alertaSuperavit`) — para corregir algo (una venta mal cargada) y volver a
 * cerrar después con `CerrarGrupoTropas`.
 */
@injectable()
export class ReabrirGrupoTropas {
  constructor(
    @inject(DI_TYPES.GrupoTropasRepository) private readonly grupoTropasRepository: GrupoTropasRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
  ) {}

  async execute(input: ReabrirGrupoTropasInput): Promise<GrupoTropasConMiembros> {
    const grupo = await this.grupoTropasRepository.getById(input.id, input.empresaId);
    if (!grupo) {
      throw new ApiError("Grupo de tropas no encontrado", Code.NOT_FOUND);
    }
    if (!grupo.cerrado) {
      throw new ApiError("El grupo no está cerrado", Code.BAD_REQUEST);
    }

    const miembros = await this.compraRepository.listByGrupo(grupo.id, input.empresaId);
    const comprasReabiertas: Compra[] = [];
    for (const compra of miembros) {
      comprasReabiertas.push(await this.compraRepository.reabrir(compra.id, input.empresaId));
    }

    const grupoReabierto = await this.grupoTropasRepository.reabrir(grupo.id, input.empresaId);
    return { ...grupoReabierto, compras: comprasReabiertas };
  }
}
