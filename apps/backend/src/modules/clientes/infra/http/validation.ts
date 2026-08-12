import { injectable } from "inversify";
import { z } from "zod";

import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";

const baseBody = z.object({
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
  esRevendedor: z.boolean().optional(),
  // Días de plazo para pagar una boleta (cuenta corriente) — si no se manda, se usa el default global (7).
  diasPlazoPago: z.coerce.number().int().min(0).max(365).nullable().optional(),
});

/**
 * Mismas reglas de negocio para alta y edición (la edición es un reemplazo
 * completo, no parcial — ver `UpdateClienteInput`): persona física
 * (nombre+apellido) O persona jurídica (razonSocial), y cuit O dni. Factoreado
 * acá para no duplicar los `.refine()` entre `createBody`/`updateBody`.
 */
function withReglasDeCliente<T extends typeof baseBody>(schema: T) {
  return schema
    .refine((data) => (data.nombre && data.apellido) || data.razonSocial, {
      message: "Tenés que indicar nombre y apellido (persona física) o razonSocial (persona jurídica)",
      path: ["razonSocial"],
    })
    .refine((data) => Boolean(data.cuit) || Boolean(data.dni), {
      message: "Tenés que indicar cuit o dni",
      path: ["cuit"],
    });
}

const createBody = withReglasDeCliente(baseBody);
const updateBody = withReglasDeCliente(baseBody);

const idParams = z.object({
  id: z.string().uuid("Id inválido"),
});

const clienteFinalParams = z.object({
  clienteId: z.string().uuid("clienteId inválido"),
});

const createClienteFinalBody = z.object({
  nombre: z.string().min(1, "Indicá un nombre").max(150),
});

@injectable()
export class ClienteValidation {
  create = { body: createBody };

  getById = { params: idParams };

  update = { params: idParams, body: updateBody };

  delete = { params: idParams };

  createClienteFinal = { params: clienteFinalParams, body: createClienteFinalBody };

  listClientesFinales = { params: clienteFinalParams };
}
