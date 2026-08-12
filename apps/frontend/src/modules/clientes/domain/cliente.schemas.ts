import { z } from "zod";

import { CondicionFiscal } from "@/modules/clientes/domain/cliente.types";

/**
 * Espejo de `ClienteValidation.create` en el backend
 * (`apps/backend/src/modules/clientes/infra/http/validation.ts`): mismas
 * reglas de negocio (persona física XOR jurídica, cuit u dni requerido),
 * repetidas acá para dar feedback instantáneo en el form sin ida y vuelta al
 * server. El backend vuelve a validar todo — esto es solo UX.
 */
export const createClienteSchema = z
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
    esRevendedor: z.boolean(),
    diasPlazoPago: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (v) => !v || (!isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 365),
        "Tiene que ser un número entero entre 0 y 365",
      ),
  })
  .refine((data) => (data.nombre && data.apellido) || data.razonSocial, {
    message: "Indicá nombre y apellido (persona física) o razón social (persona jurídica)",
    path: ["razonSocial"],
  })
  .refine((data) => Boolean(data.cuit) || Boolean(data.dni), {
    message: "Indicá CUIT o DNI",
    path: ["cuit"],
  });

export type CreateClienteFormValues = z.infer<typeof createClienteSchema>;
