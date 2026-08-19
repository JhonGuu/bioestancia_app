import { injectable } from "inversify";
import { z } from "zod";

const createBody = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(255),
  cuit: z.string().max(20).optional(),
  senasaNumero: z.string().max(30).optional(),
  rucaNumero: z.string().max(30).optional(),
});

const updateBody = createBody;

const idParams = z.object({
  id: z.string().uuid("Id inválido"),
});

const listQuery = z.object({
  estado: z.enum(["activos", "inactivos", "todos"]).optional(),
});

@injectable()
export class FrigorificoValidation {
  create = { body: createBody };

  list = { query: listQuery };

  getById = { params: idParams };

  update = { params: idParams, body: updateBody };

  delete = { params: idParams };

  reactivar = { params: idParams };
}
