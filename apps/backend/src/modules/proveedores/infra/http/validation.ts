import { injectable } from "inversify";
import { z } from "zod";

import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { CodigoAfipPorcino } from "@/modules/proveedores/domain/codigo-afip-porcino";

const createBody = z
  .object({
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
    // CBU/CVU: 22 dígitos numéricos exactos (mismo formato para los dos).
    datosBancarios: z
      .string()
      .regex(/^[0-9]{22}$/, "CBU/CVU inválido: tiene que tener 22 dígitos numéricos")
      .optional(),
    porcentajeDesbaste: z.coerce.number().min(0).max(100).optional(),
    // RENSPA (SENASA): "provincia.departamento.tipo.secuencial/verificador".
    renspa: z
      .string()
      .regex(/^\d{2}\.\d{3}\.\d\.\d{5}\/\d{2}$/, "RENSPA inválido: formato esperado NN.NNN.N.NNNNN/NN")
      .optional(),
    codigoAfip: z.nativeEnum(CodigoAfipPorcino).optional(),
  })
  // Misma regla que clientes: persona física (nombre+apellido) O jurídica (razonSocial).
  .refine((data) => (data.nombre && data.apellido) || data.razonSocial, {
    message: "Tenés que indicar nombre y apellido (persona física) o razonSocial (persona jurídica)",
    path: ["razonSocial"],
  })
  // Necesita un documento, cuit O dni.
  .refine((data) => Boolean(data.cuit) || Boolean(data.dni), {
    message: "Tenés que indicar cuit o dni",
    path: ["cuit"],
  });

@injectable()
export class ProveedorValidation {
  create = { body: createBody };

  getById = {
    params: z.object({
      id: z.string().uuid("Id inválido"),
    }),
  };
}
