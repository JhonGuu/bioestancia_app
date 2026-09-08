import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";

export interface CreateCargoCuentaCorrienteUseCaseInput {
  empresaId: string;
  clienteId: string;
  tipo: TipoCargo;
  monto: number;
  motivo?: string;
  fecha: Date;
}

/**
 * Carga manual de un cargo (`tipo: "otro"`, ajustes puntuales) — los cargos
 * `RECARGO_CHEQUE`/`COMISION_RECHAZO` se crean siempre desde
 * `modules/cobros` (`ConfirmarRecargoCheque`/`ConfirmarRechazoCheque`), no
 * desde este use-case genérico.
 */
@injectable()
export class CreateCargoCuentaCorriente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
    @inject(DI_TYPES.GenerarAsientosAutomaticos) private readonly generarAsientosAutomaticos: GenerarAsientosAutomaticos,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: CreateCargoCuentaCorrienteUseCaseInput): Promise<CargoCuentaCorriente> {
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
    }
    if (input.monto <= 0) {
      throw new ApiError("El monto tiene que ser mayor a cero", Code.BAD_REQUEST);
    }
    const cargo = await this.cargoCuentaCorrienteRepository.create({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      tipo: input.tipo,
      monto: input.monto,
      motivo: input.motivo,
      fecha: input.fecha,
    });

    if (cargo.tipo === TipoCargo.OTRO) {
      const { advertencia } = await this.generarAsientosAutomaticos.execute({
        empresaId: input.empresaId,
        evento: EventoAsiento.CARGO_OTRO,
        origenId: cargo.id,
        fecha: cargo.fecha,
        descripcion: cargo.motivo ?? "Cargo en cuenta corriente",
        unidades: [{ monto: cargo.monto, clienteId: cargo.clienteId }],
      });
      if (advertencia) this.logger.warn(advertencia);
    }

    return cargo;
  }
}
