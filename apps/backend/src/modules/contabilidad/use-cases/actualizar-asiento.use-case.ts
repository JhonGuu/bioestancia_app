import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Asiento, EstadoAsiento, RespaldoAsiento } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository, LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { validarLineasAsiento } from "@/modules/contabilidad/domain/validar-lineas";
import { ResolverContextoAsiento } from "@/modules/contabilidad/use-cases/resolver-contexto-asiento.use-case";

export interface ActualizarAsientoInput {
  fecha?: Date;
  descripcion?: string;
  respaldo?: RespaldoAsiento;
  lineas?: LineaAsientoInput[];
}

/**
 * Edita un asiento. Se puede editar mientras su período esté abierto,
 * confirmado o no — cerrar el período es lo que lo congela.
 *
 * Un asiento anulado no se edita: se carga uno nuevo.
 */
@injectable()
export class ActualizarAsiento {
  constructor(
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.ResolverContextoAsiento) private readonly resolverContexto: ResolverContextoAsiento,
  ) {}

  async execute(id: string, empresaId: string, input: ActualizarAsientoInput): Promise<Asiento> {
    const asiento = await this.asientoRepository.getById(id, empresaId);
    if (!asiento) throw new ApiError("El asiento no existe", Code.NOT_FOUND);
    if (asiento.estado === EstadoAsiento.ANULADO) {
      throw new ApiError("Un asiento anulado no se puede editar — cargá uno nuevo", Code.BAD_REQUEST);
    }

    // El período de ORIGEN tiene que estar abierto para poder tocarlo.
    await this.resolverContexto.execute(empresaId, asiento.fecha);

    // Si se le cambia la fecha, el período de DESTINO también.
    let periodoId: string | undefined;
    if (input.fecha && input.fecha.getTime() !== asiento.fecha.getTime()) {
      const destino = await this.resolverContexto.execute(empresaId, input.fecha);
      if (destino.ejercicio.id !== asiento.ejercicioId) {
        throw new ApiError(
          "La fecha nueva cae en otro ejercicio — anulá este asiento y cargalo en el ejercicio que corresponde",
          Code.BAD_REQUEST,
        );
      }
      periodoId = destino.periodo.id;
    }

    if (input.lineas) {
      const cuentas = await this.cuentaRepository.list(empresaId);
      const errores = validarLineasAsiento(input.lineas, new Map(cuentas.map((c) => [c.id, c])));
      if (errores.length > 0) throw new ApiError(errores.join(" · "), Code.BAD_REQUEST);
    }

    return this.asientoRepository.update(id, empresaId, {
      fecha: input.fecha,
      periodoId,
      descripcion: input.descripcion,
      respaldo: input.respaldo,
      lineas: input.lineas,
    });
  }
}
