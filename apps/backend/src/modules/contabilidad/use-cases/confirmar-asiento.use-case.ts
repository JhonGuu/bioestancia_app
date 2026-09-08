import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Asiento, EstadoAsiento, estaBalanceado } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { ResolverContextoAsiento } from "@/modules/contabilidad/use-cases/resolver-contexto-asiento.use-case";

/**
 * Pasa un borrador a firme y le asigna el número correlativo del ejercicio.
 * El número se toma recién acá para que los borradores no consuman
 * numeración y el diario no quede con huecos.
 */
@injectable()
export class ConfirmarAsiento {
  constructor(
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
    @inject(DI_TYPES.ResolverContextoAsiento) private readonly resolverContexto: ResolverContextoAsiento,
  ) {}

  async execute(id: string, empresaId: string): Promise<Asiento> {
    const asiento = await this.asientoRepository.getById(id, empresaId);
    if (!asiento) throw new ApiError("El asiento no existe", Code.NOT_FOUND);
    if (asiento.estado === EstadoAsiento.CONFIRMADO) return asiento;
    if (asiento.estado === EstadoAsiento.ANULADO) {
      throw new ApiError("El asiento está anulado", Code.BAD_REQUEST);
    }

    await this.resolverContexto.execute(empresaId, asiento.fecha);

    if (!estaBalanceado(asiento.lineas)) {
      throw new ApiError("El asiento no balancea: la suma del debe no iguala a la del haber", Code.BAD_REQUEST);
    }

    const numero = asiento.numero ?? (await this.asientoRepository.siguienteNumero(asiento.ejercicioId));
    return this.asientoRepository.cambiarEstado(id, empresaId, EstadoAsiento.CONFIRMADO, numero);
  }
}
