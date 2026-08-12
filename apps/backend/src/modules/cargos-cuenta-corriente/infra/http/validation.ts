import { injectable } from "inversify";
import { z } from "zod";

import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

const createBody = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
  tipo: z.nativeEnum(TipoCargo),
  monto: z.coerce.number().positive("El monto tiene que ser mayor a 0"),
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
