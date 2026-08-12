import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import {
  PORCENTAJE_RECARGO_CHEQUE,
  calcularDiasPlazoCheque,
  calcularMontoRecargoCheque,
  correspondeRecargoCheque,
} from "@/modules/cobros/domain/calcular-cargos-cheque";

export interface SugerirRecargoChequeInput {
  chequeId: string;
  empresaId: string;
}

export interface SugerenciaRecargoCheque {
  chequeId: string;
  clienteId: string;
  dias: number;
  corresponde: boolean;
  porcentaje: number;
  montoCheque: number;
  montoSugerido: number;
  /** `true` si ya se confirmó este recargo antes (ver `ConfirmarRecargoCheque`) — no se puede confirmar de nuevo. */
  yaConfirmado: boolean;
}

/**
 * Calcula (sin persistir nada) si un cheque entregado corresponde recargo
 * del 5% por haberse entregado a más de 7 días de su fecha de cobro —
 * compara `Cheque.fechaPago` contra la fecha del `Cobro` que lo originó
 * (cuándo el cliente lo entregó). Solo informa; la carga real la hace
 * `ConfirmarRecargoCheque`, a mano.
 */
@injectable()
export class SugerirRecargoCheque {
  constructor(
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: SugerirRecargoChequeInput): Promise<SugerenciaRecargoCheque> {
    const cheque = await this.chequeRepository.getById(input.chequeId, input.empresaId);
    if (!cheque) {
      throw new ApiError("Cheque no encontrado", Code.NOT_FOUND);
    }
    const cobro = await this.cobroRepository.getByChequeId(input.chequeId, input.empresaId);
    if (!cobro) {
      throw new ApiError("No se encontró el cobro que originó este cheque", Code.INTERNAL_SERVER_ERROR);
    }

    const dias = calcularDiasPlazoCheque(cobro.fecha, cheque.fechaPago);
    const corresponde = correspondeRecargoCheque(dias);
    const yaConfirmado =
      (await this.cargoCuentaCorrienteRepository.getByChequeYTipo(
        input.chequeId,
        TipoCargo.RECARGO_CHEQUE,
        input.empresaId,
      )) !== null;

    return {
      chequeId: cheque.id,
      clienteId: cheque.clienteId,
      dias,
      corresponde,
      porcentaje: PORCENTAJE_RECARGO_CHEQUE,
      montoCheque: cheque.monto,
      montoSugerido: corresponde ? calcularMontoRecargoCheque(cheque.monto) : 0,
      yaConfirmado,
    };
  }
}
