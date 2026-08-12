import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { PORCENTAJE_COMISION_RECHAZO, calcularMontoComisionRechazo } from "@/modules/cobros/domain/calcular-cargos-cheque";

export interface SugerirReversionChequeRechazadoInput {
  chequeId: string;
  empresaId: string;
}

export interface SugerenciaReversionChequeRechazado {
  chequeId: string;
  clienteId: string;
  montoCheque: number;
  /** Hasta cuánto se va a liberar de boletas ya dadas por cobradas con este cheque (como máximo, el monto del cheque). */
  montoARevertir: number;
  porcentajeComision: number;
  comisionSugerida: number;
  /** `true` si ya se confirmó esta reversión/comisión antes — no se puede confirmar de nuevo. */
  yaConfirmado: boolean;
}

/**
 * Calcula (sin persistir nada) qué implica marcar como definitivo el
 * rechazo de un cheque: cuánto habría que revertir de lo aplicado a
 * boletas (el cheque nunca se cobró de verdad) y la comisión del 7%. Solo
 * informa; `ConfirmarRechazoCheque` hace el ajuste real, a mano.
 */
@injectable()
export class SugerirReversionChequeRechazado {
  constructor(
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: SugerirReversionChequeRechazadoInput): Promise<SugerenciaReversionChequeRechazado> {
    const cheque = await this.chequeRepository.getById(input.chequeId, input.empresaId);
    if (!cheque) {
      throw new ApiError("Cheque no encontrado", Code.NOT_FOUND);
    }
    if (cheque.estado !== EstadoCheque.RECHAZADO) {
      throw new ApiError("El cheque no está marcado como rechazado", Code.BAD_REQUEST);
    }

    const yaConfirmado =
      (await this.cargoCuentaCorrienteRepository.getByChequeYTipo(
        input.chequeId,
        TipoCargo.COMISION_RECHAZO,
        input.empresaId,
      )) !== null;

    return {
      chequeId: cheque.id,
      clienteId: cheque.clienteId,
      montoCheque: cheque.monto,
      montoARevertir: cheque.monto,
      porcentajeComision: PORCENTAJE_COMISION_RECHAZO,
      comisionSugerida: calcularMontoComisionRechazo(cheque.monto),
      yaConfirmado,
    };
  }
}
