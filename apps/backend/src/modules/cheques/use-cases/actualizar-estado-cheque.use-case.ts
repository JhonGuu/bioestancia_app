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
  endosadoA?: string | null;
  fechaEndoso?: Date | null;
}

/**
 * Cambia el estado de un cheque (en cartera → depositado → acreditado, o
 * rechazado, o endosado a terceros). No fuerza una transición estricta entre
 * estados — en la práctica un cheque puede saltar pasos o corregirse a mano.
 *
 * Exige `motivoRechazo` cuando el nuevo estado es `RECHAZADO`, y
 * `endosadoA`+`fechaEndoso` cuando es `ENDOSADO_A_TERCEROS`.
 */
@injectable()
export class ActualizarEstadoCheque {
  constructor(@inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository) {}

  async execute(input: ActualizarEstadoChequeUseCaseInput): Promise<Cheque> {
    if (input.estado === EstadoCheque.RECHAZADO && !input.motivoRechazo) {
      throw new ApiError("Indicá el motivo del rechazo", Code.BAD_REQUEST);
    }
    if (input.estado === EstadoCheque.ENDOSADO_A_TERCEROS && (!input.endosadoA || !input.fechaEndoso)) {
      throw new ApiError("Indicá a quién y cuándo se endosó el cheque", Code.BAD_REQUEST);
    }
    return this.chequeRepository.actualizarEstado(input.id, input.empresaId, {
      estado: input.estado,
      motivoRechazo: input.estado === EstadoCheque.RECHAZADO ? input.motivoRechazo : null,
      endosadoA: input.estado === EstadoCheque.ENDOSADO_A_TERCEROS ? input.endosadoA : null,
      fechaEndoso: input.estado === EstadoCheque.ENDOSADO_A_TERCEROS ? input.fechaEndoso : null,
    });
  }
}
