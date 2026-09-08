import { injectable } from "inversify";
import { z } from "zod";

import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

const createBody = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
  tipo: z.nativeEnum(TipoCargo),
  monto: z.coerce.number().refine((v) => v !== 0, "El monto no puede ser cero"),
  motivo: z.string().max(255).optional(),
  fecha: z.coerce.date(),
});

const listQuery = z.object({
  clienteId: z.string().uuid().optional(),
});

@injectable()
export class CargoCuentaCorrienteValidation {
  create = { body: createBody };

  list = { query: listQuery };
}
