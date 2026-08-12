import { injectable } from "inversify";
import { z } from "zod";

import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";

const idParams = z.object({
  id: z.string().uuid("Id inválido"),
});

const listQuery = z.object({
  estado: z.nativeEnum(EstadoCheque).optional(),
  clienteId: z.string().uuid().optional(),
});

const actualizarEstadoBody = z
  .object({
    estado: z.nativeEnum(EstadoCheque),
    motivoRechazo: z.string().max(255).optional(),
  })
  .refine((data) => data.estado !== EstadoCheque.RECHAZADO || Boolean(data.motivoRechazo), {
    message: "Indicá el motivo del rechazo",
    path: ["motivoRechazo"],
  });

@injectable()
export class ChequeValidation {
  list = { query: listQuery };

  getById = { params: idParams };

  actualizarEstado = { params: idParams, body: actualizarEstadoBody };
}
