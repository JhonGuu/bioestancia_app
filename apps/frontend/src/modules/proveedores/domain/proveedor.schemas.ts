import { z } from "zod";

import { CondicionFiscal } from "@/modules/clientes/domain/cliente.types";
import { CodigoAfipPorcino } from "@/modules/proveedores/domain/proveedor.types";

/**
 * Espejo de `ProveedorValidation.create` en el backend
 * (`apps/backend/src/modules/proveedores/infra/http/validation.ts`): misma
 * regla física XOR jurídica que clientes, más `datosBancarios` (CBU/CVU, 22
 * dígitos) y `porcentajeDesbaste` — propios de proveedor, no de cliente.
 */
export const createProveedorSchema = z
  .object({
    nombre: z.string().min(1).max(100).optional().or(z.literal("")),
    apellido: z.string().min(1).max(100).optional().or(z.literal("")),
    razonSocial: z.string().min(1).max(255).optional().or(z.literal("")),
    cuit: z.string().max(20).optional().or(z.literal("")),
    dni: z.string().max(20).optional().or(z.literal("")),
    domicilio: z.string().max(255).optional().or(z.literal("")),
    email: z.string().email("Email inválido").max(255).optional().or(z.literal("")),
    pais: z.string().max(100).optional().or(z.literal("")),
    provincia: z.string().max(100).optional().or(z.literal("")),
    ubicacion: z.string().max(255).optional().or(z.literal("")),
    condicionFiscal: z.nativeEnum(CondicionFiscal, {
      message: "Elegí una condición fiscal",
    }),
    datosBancarios: z
      .string()
      .regex(/^[0-9]{22}$/, "CBU/CVU inválido: tiene que tener 22 dígitos numéricos")
      .optional()
      .or(z.literal("")),
    porcentajeDesbaste: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
        "Tiene que ser un número entre 0 y 100",
      ),
    // RENSPA (SENASA): "provincia.departamento.tipo.secuencial/verificador".
    renspa: z
      .string()
      .regex(/^\d{2}\.\d{3}\.\d\.\d{5}\/\d{2}$/, "RENSPA inválido: formato esperado NN.NNN.N.NNNNN/NN")
      .optional()
      .or(z.literal("")),
    codigoAfip: z.nativeEnum(CodigoAfipPorcino).optional().or(z.literal("")),
  })
  .refine((data) => (data.nombre && data.apellido) || data.razonSocial, {
    message: "Indicá nombre y apellido (persona física) o razón social (persona jurídica)",
    path: ["razonSocial"],
  })
  .refine((data) => Boolean(data.cuit) || Boolean(data.dni), {
    message: "Indicá CUIT o DNI",
    path: ["cuit"],
  });

export type CreateProveedorFormValues = z.infer<typeof createProveedorSchema>;
