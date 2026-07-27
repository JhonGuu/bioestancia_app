import { injectable } from "inversify";
import { z } from "zod";

import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";

const createBody = z
  .object({
    listaDePreciosId: z.string().uuid().optional(),
    nombre: z.string().min(1).max(100).optional(),
    apellido: z.string().min(1).max(100).optional(),
    razonSocial: z.string().min(1).max(255).optional(),
    cuit: z.string().max(20).optional(),
    dni: z.string().max(20).optional(),
    domicilio: z.string().max(255).optional(),
    email: z.string().email("Email inválido").max(255).optional(),
    pais: z.string().max(100).optional(),
    provincia: z.string().max(100).optional(),
    ubicacion: z.string().max(255).optional(),
    condicionFiscal: z.nativeEnum(CondicionFiscal),
  })
  // Regla de negocio: persona física (nombre+apellido) O persona jurídica
  // (razonSocial) — nunca ninguna de las dos. Va acá y no en el dominio
  // porque es una regla de validación de entrada, no la forma del dato.
  .refine((data) => (data.nombre && data.apellido) || data.razonSocial, {
    message: "Tenés que indicar nombre y apellido (persona física) o razonSocial (persona jurídica)",
    path: ["razonSocial"],
  })
  // Regla de negocio: necesita un documento, cuit O dni.
  .refine((data) => Boolean(data.cuit) || Boolean(data.dni), {
    message: "Tenés que indicar cuit o dni",
    path: ["cuit"],
  });

@injectable()
export class ClienteValidation {
  create = { body: createBody };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
