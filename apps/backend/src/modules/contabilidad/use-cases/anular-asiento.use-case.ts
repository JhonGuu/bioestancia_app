import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Asiento, EstadoAsiento } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { ResolverContextoAsiento } from "@/modules/contabilidad/use-cases/resolver-contexto-asiento.use-case";

export interface AnularAsientoResultado {
  asiento: Asiento | null;
  eliminado: boolean;
  mensaje: string;
}

/**
 * Un borrador se borra y listo (nunca existió para el diario). Un asiento
 * confirmado se ANULA: mantiene su número y queda visible en el diario como
 * anulado, para que la numeración no tenga huecos inexplicables.
 */
@injectable()
export class AnularAsiento {
  constructor(
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
    @inject(DI_TYPES.ResolverContextoAsiento) private readonly resolverContexto: ResolverContextoAsiento,
  ) {}

  async execute(id: string, empresaId: string): Promise<AnularAsientoResultado> {
    const asiento = await this.asientoRepository.getById(id, empresaId);
    if (!asiento) throw new ApiError("El asiento no existe", Code.NOT_FOUND);

    await this.resolverContexto.execute(empresaId, asiento.fecha);

    if (asiento.estado === EstadoAsiento.BORRADOR) {
      await this.asientoRepository.delete(id, empresaId);
      return { asiento: null, eliminado: true, mensaje: "Borrador eliminado" };
    }

    const anulado = await this.asientoRepository.cambiarEstado(id, empresaId, EstadoAsiento.ANULADO);
    return {
      asiento: anulado,
      eliminado: false,
      mensaje: `Asiento N° ${asiento.numero} anulado — queda en el diario con su número, marcado como anulado`,
    };
  }
}
