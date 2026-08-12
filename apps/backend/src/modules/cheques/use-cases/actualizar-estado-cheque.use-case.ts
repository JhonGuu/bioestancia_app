import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Cheque } from "@/modules/cheques/domain/cheque";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";

export interface ActualizarEstadoChequeUseCaseInput {
  id: string;
  empresaId: string;
  estado: EstadoCheque;
  motivoRechazo?: string | null;
}

/**
 * Cambia el estado de un cheque (en cartera → depositado → acreditado, o
 * rechazado, o endosado a terceros). No fuerza una transición estricta entre
 * estados — en la práctica un cheque puede saltar pasos o corregirse a mano.
 *
 * Exige `motivoRechazo` cuando el nuevo estado es `RECHAZADO`.
 */
@injectable()
export class ActualizarEstadoCheque {
  constructor(@inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository) {}

  async execute(input: ActualizarEstadoChequeUseCaseInput): Promise<Cheque> {
    if (input.estado === EstadoCheque.RECHAZADO && !input.motivoRechazo) {
      throw new ApiError("Indicá el motivo del rechazo", Code.BAD_REQUEST);
    }
    return this.chequeRepository.actualizarEstado(input.id, input.empresaId, {
      estado: input.estado,
      motivoRechazo: input.estado === EstadoCheque.RECHAZADO ? input.motivoRechazo : null,
    });
  }
}
