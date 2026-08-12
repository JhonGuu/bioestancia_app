import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { calcularMontoRecargoCheque } from "@/modules/cobros/domain/calcular-cargos-cheque";

export interface ConfirmarRecargoChequeInput {
  chequeId: string;
  empresaId: string;
  /** Permite ajustar el monto sugerido (5% del cheque) antes de confirmar. Si no viene, se usa el sugerido. */
  monto?: number;
}

/**
 * Confirma (a mano — ver `SugerirRecargoCheque`) el recargo del 5% de un
 * cheque entregado a más de 7 días de su fecha de cobro, creando el
 * `CargoCuentaCorriente` correspondiente. No valida de nuevo que
 * "corresponda" (eso ya lo mostró la sugerencia) — administración puede
 * confirmarlo igual aunque el plazo sea justo, o ajustar el monto.
 */
@injectable()
export class ConfirmarRecargoCheque {
  constructor(
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: ConfirmarRecargoChequeInput): Promise<CargoCuentaCorriente> {
    const cheque = await this.chequeRepository.getById(input.chequeId, input.empresaId);
    if (!cheque) {
      throw new ApiError("Cheque no encontrado", Code.NOT_FOUND);
    }

    const existente = await this.cargoCuentaCorrienteRepository.getByChequeYTipo(
      input.chequeId,
      TipoCargo.RECARGO_CHEQUE,
      input.empresaId,
    );
    if (existente) {
      throw new ApiError("Ya se confirmó el recargo de este cheque", Code.CONFLICT);
    }

    const monto = input.monto ?? calcularMontoRecargoCheque(cheque.monto);
    if (monto <= 0) {
      throw new ApiError("El monto del recargo tiene que ser mayor a cero", Code.BAD_REQUEST);
    }

    return this.cargoCuentaCorrienteRepository.create({
      empresaId: input.empresaId,
      clienteId: cheque.clienteId,
      tipo: TipoCargo.RECARGO_CHEQUE,
      monto,
      chequeId: cheque.id,
      motivo: `Recargo por cheque Nº ${cheque.numero} entregado a más de 7 días de su fecha de cobro`,
      fecha: new Date(),
    });
  }
}
