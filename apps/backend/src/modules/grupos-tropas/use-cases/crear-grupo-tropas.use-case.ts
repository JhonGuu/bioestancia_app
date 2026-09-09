import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Compra } from "@/modules/compras/domain/compra";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { repartirProporcional } from "@/modules/compras/domain/repartir-proporcional.util";
import { UpdateCompra } from "@/modules/compras/use-cases/update-compra.use-case";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";

export interface CrearGrupoTropasInput {
  empresaId: string;
  /** Al menos 2 tropas distintas, ninguna cerrada ni ya perteneciente a otro grupo. */
  compraIds: string[];
  /** Peso vivo de báscula REAL del grupo completo — se reparte proporcional a las cabezas de cada tropa miembro. */
  pesoBrutoTotal: number;
  nombre?: string;
  comentarios?: string;
}

export interface GrupoTropasConMiembros extends GrupoTropas {
  compras: Compra[];
}

/**
 * Crea un `GrupoTropas` a partir de 2+ tropas (`Compra`) existentes y
 * redistribuye el peso REAL del grupo entre ellas, proporcional a la
 * cantidad de cabezas de cada una — ver `plan-unificacion-tropas-despacho.md`.
 *
 * El reparto reutiliza `UpdateCompra` para pisar el `pesoBruto` de cada
 * tropa miembro (que a su vez recalcula `pesoNeto` y vuelve a evaluar el
 * asiento automático de la compra con el peso corregido — a diferencia de
 * los importadores HISTÓRICOS, esta es una operación en vivo: si cambia el
 * peso real de una tropa ya cargada, el asiento contable tiene que reflejar
 * la corrección).
 *
 * No admite agrupar tropas ya cerradas (se agrupa ANTES de cerrar — el
 * cierre conjunto lo hace `CerrarGrupoTropas`) ni tropas que ya pertenecen a
 * otro grupo abierto.
 */
@injectable()
export class CrearGrupoTropas {
  constructor(
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository)
    private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.GrupoTropasRepository) private readonly grupoTropasRepository: GrupoTropasRepository,
    @inject(DI_TYPES.UpdateCompra) private readonly updateCompra: UpdateCompra,
  ) {}

  async execute(input: CrearGrupoTropasInput): Promise<GrupoTropasConMiembros> {
    const idsUnicos = Array.from(new Set(input.compraIds));
    if (idsUnicos.length < 2) {
      throw new ApiError("Hacen falta al menos 2 tropas distintas para armar un grupo", Code.BAD_REQUEST);
    }
    if (input.pesoBrutoTotal <= 0) {
      throw new ApiError("pesoBrutoTotal tiene que ser mayor a 0", Code.BAD_REQUEST);
    }

    const compras: Compra[] = [];
    for (const id of idsUnicos) {
      const compra = await this.compraRepository.getById(id, input.empresaId);
      if (!compra) {
        throw new ApiError(`Compra ${id} no encontrada`, Code.NOT_FOUND);
      }
      if (compra.cerrada) {
        throw new ApiError(`La tropa ${compra.numero} ya está cerrada — no se puede agrupar`, Code.BAD_REQUEST);
      }
      if (compra.grupoTropasId !== null) {
        throw new ApiError(`La tropa ${compra.numero} ya pertenece a otro grupo de tropas`, Code.BAD_REQUEST);
      }
      compras.push(compra);
    }

    const cabezasPorCompra: number[] = [];
    for (const compra of compras) {
      const categorias = await this.compraCategoriaRepository.listByCompra(compra.id);
      cabezasPorCompra.push(categorias.reduce((acc, c) => acc + c.cabezas, 0));
    }
    if (cabezasPorCompra.some((cabezas) => cabezas === 0)) {
      throw new ApiError(
        "Todas las tropas del grupo tienen que tener cabezas cargadas en sus categorías",
        Code.BAD_REQUEST,
      );
    }

    const pesoBrutoPorCompra = repartirProporcional(input.pesoBrutoTotal, cabezasPorCompra);
    const pesoNetoPorCompra = compras.map((compra, i) =>
      Math.round(pesoBrutoPorCompra[i]! * (1 - compra.porcentajeDesbaste / 100) * 100) / 100,
    );
    const pesoNetoTotal = Math.round(pesoNetoPorCompra.reduce((acc, p) => acc + p, 0) * 100) / 100;

    const grupo = await this.grupoTropasRepository.create({
      empresaId: input.empresaId,
      nombre: input.nombre,
      pesoBrutoTotal: input.pesoBrutoTotal,
      pesoNetoTotal,
      comentarios: input.comentarios,
    });

    const comprasActualizadas: Compra[] = [];
    for (let i = 0; i < compras.length; i++) {
      const compra = compras[i]!;
      await this.updateCompra.execute({
        id: compra.id,
        empresaId: input.empresaId,
        pesoBruto: pesoBrutoPorCompra[i]!,
      });
      const conGrupo = await this.compraRepository.asignarGrupo(compra.id, input.empresaId, grupo.id);
      comprasActualizadas.push(conGrupo);
    }

    return { ...grupo, compras: comprasActualizadas };
  }
}
