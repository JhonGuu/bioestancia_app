import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";

export interface CerrarGrupoTropasInput {
  id: string;
  empresaId: string;
}

export interface GrupoTropasConMiembros extends GrupoTropas {
  compras: Compra[];
}

/**
 * Cierra un `GrupoTropas`: reconcilia cabezas vendidas contra compradas
 * SUMADAS sobre todas las tropas miembro (no tropa por tropa — resuelve el
 * caso del despacho sin trazabilidad, ver `plan-unificacion-tropas-despacho.md`)
 * y calcula un único rinde para el grupo.
 *
 * Mismo criterio de superávit/déficit que `CerrarCompra`:
 * - Si las vendidas son MENOS que las compradas, bloquea (todavía no se
 *   despachó del todo).
 * - Si las vendidas son MÁS que las compradas, NO bloquea — deja
 *   `alertaSuperavit: true` como aviso (probablemente falte un DTE).
 *
 * Cada tropa miembro queda marcada `cerrada` con su propio `pesoFinalVenta`
 * (la parte que le corresponde), pero `rinde: null` — el rinde vive una sola
 * vez, acá, en el grupo.
 */
@injectable()
export class CerrarGrupoTropas {
  constructor(
    @inject(DI_TYPES.GrupoTropasRepository) private readonly grupoTropasRepository: GrupoTropasRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
  ) {}

  async execute(input: CerrarGrupoTropasInput): Promise<GrupoTropasConMiembros> {
    const grupo = await this.grupoTropasRepository.getById(input.id, input.empresaId);
    if (!grupo) {
      throw new ApiError("Grupo de tropas no encontrado", Code.NOT_FOUND);
    }
    if (grupo.cerrado) {
      throw new ApiError("El grupo ya está cerrado", Code.BAD_REQUEST);
    }

    const miembros = await this.compraRepository.listByGrupo(grupo.id, input.empresaId);
    if (miembros.length < 2) {
      throw new ApiError("El grupo tiene que tener al menos 2 tropas miembro", Code.BAD_REQUEST);
    }

    let cabezasCompradasTotal = 0;
    let cabezasVendidasTotal = 0;
    let pesoFinalVentaTotal = 0;
    const pesoFinalVentaPorMiembro = new Map<string, number>();

    for (const compra of miembros) {
      const categorias = await this.compraCategoriaRepository.listByCompra(compra.id);
      cabezasCompradasTotal += categorias.reduce((acc, c) => acc + c.cabezas, 0);

      const ventasDeLaCompra = await this.ventaRepository.listByCompra(compra.id, input.empresaId);
      const garronesDistintos = new Set(
        ventasDeLaCompra
          .filter((v) => v.formaVenta !== FormaVenta.COMPENSACION_KG && v.garron !== null)
          .map((v) => v.garron),
      );
      cabezasVendidasTotal += garronesDistintos.size;

      const pesoFinalVentaMiembro = ventasDeLaCompra.reduce((acc, v) => acc + v.kg, 0);
      pesoFinalVentaPorMiembro.set(compra.id, pesoFinalVentaMiembro);
      pesoFinalVentaTotal += pesoFinalVentaMiembro;
    }

    if (cabezasVendidasTotal < cabezasCompradasTotal) {
      throw new ApiError(
        `Las cabezas vendidas del grupo (${cabezasVendidasTotal}) son menos que las compradas ` +
          `(${cabezasCompradasTotal}). No se puede cerrar el grupo todavía.`,
        Code.BAD_REQUEST,
      );
    }
    const alertaSuperavit = cabezasVendidasTotal > cabezasCompradasTotal;

    pesoFinalVentaTotal = Math.round(pesoFinalVentaTotal * 100) / 100;
    const rinde = Math.round((pesoFinalVentaTotal / grupo.pesoNetoTotal) * 100 * 100) / 100;
    const fechaCierre = new Date();

    const grupoCerrado = await this.grupoTropasRepository.cerrar(grupo.id, input.empresaId, {
      pesoFinalVentaTotal,
      rinde,
      alertaSuperavit,
      fechaCierre,
    });

    const comprasActualizadas: Compra[] = [];
    for (const compra of miembros) {
      const pesoFinalVentaMiembro = Math.round((pesoFinalVentaPorMiembro.get(compra.id) ?? 0) * 100) / 100;
      const actualizada = await this.compraRepository.cerrar(compra.id, input.empresaId, {
        pesoFinalVenta: pesoFinalVentaMiembro,
        rinde: null,
        alertaSuperavit,
        fechaCierre,
      });
      comprasActualizadas.push(actualizada);
    }

    return { ...grupoCerrado, compras: comprasActualizadas };
  }
}
