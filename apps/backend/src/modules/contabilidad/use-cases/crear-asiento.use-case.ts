import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Asiento, EstadoAsiento, RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository, LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { validarLineasAsiento } from "@/modules/contabilidad/domain/validar-lineas";
import { ResolverContextoAsiento } from "@/modules/contabilidad/use-cases/resolver-contexto-asiento.use-case";

export interface CrearAsientoInput {
  empresaId: string;
  fecha: Date;
  descripcion: string;
  lineas: LineaAsientoInput[];
  /** Cualquier tipo: manual, pero también apertura, cierre o refundición cargados a mano. */
  tipo?: TipoAsiento;
  respaldo?: RespaldoAsiento;
  /** Si es `true` nace numerado y firme; si no, queda en borrador. */
  confirmar?: boolean;
}

/**
 * Carga manual de un asiento. Acepta cualquier `tipo` — un cierre o una
 * apertura escritos a mano son asientos como cualquier otro, solo que
 * etiquetados; los generadores automáticos (fase 5) son un atajo, nunca el
 * único camino.
 */
@injectable()
export class CrearAsiento {
  constructor(
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.ResolverContextoAsiento) private readonly resolverContexto: ResolverContextoAsiento,
  ) {}

  async execute(input: CrearAsientoInput): Promise<Asiento> {
    const { ejercicio, periodo } = await this.resolverContexto.execute(input.empresaId, input.fecha);

    const tipo = input.tipo ?? TipoAsiento.MANUAL;
    if (tipo === TipoAsiento.APERTURA || tipo === TipoAsiento.CIERRE) {
      const yaExiste = await this.asientoRepository.existePorTipo(ejercicio.id, tipo);
      if (yaExiste) {
        throw new ApiError(
          `El ejercicio "${ejercicio.nombre}" ya tiene un asiento de ${tipo}`,
          Code.BAD_REQUEST,
        );
      }
    }

    const cuentas = await this.cuentaRepository.list(input.empresaId);
    const errores = validarLineasAsiento(input.lineas, new Map(cuentas.map((c) => [c.id, c])));
    if (errores.length > 0) {
      throw new ApiError(errores.join(" · "), Code.BAD_REQUEST);
    }

    const confirmar = input.confirmar ?? false;

    return this.asientoRepository.create({
      empresaId: input.empresaId,
      ejercicioId: ejercicio.id,
      periodoId: periodo.id,
      fecha: input.fecha,
      tipo,
      estado: confirmar ? EstadoAsiento.CONFIRMADO : EstadoAsiento.BORRADOR,
      numero: confirmar ? await this.asientoRepository.siguienteNumero(ejercicio.id) : null,
      respaldo: input.respaldo ?? RespaldoAsiento.SIN_COMPROBANTE,
      descripcion: input.descripcion,
      lineas: input.lineas,
    });
  }
}
