import { z } from "zod";

/**
 * Espejo de `LiquidacionCompraValidation.create` en el backend
 * (`apps/backend/src/modules/liquidacion-compra/infra/http/validation.ts`).
 * Numéricos como `string` (no `z.coerce.number()`) — mismo criterio que en
 * `resultado-faena.schemas.ts`/`liquidacion-faena.schemas.ts`.
 */
const categoriaFacturadaSchema = z.object({
  compraCategoriaId: z.string().uuid(),
  precioKg: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Tiene que ser mayor a 0"),
  porcentajeIva: z
    .string()
    .min(1, "Requerido")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100,
      "Tiene que ser un número entre 0 y 100",
    ),
});

export const createLiquidacionCompraSchema = z.object({
  numeroComprobante: z.string().min(1, "Requerido").max(30),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  fechaOperacion: z.string().optional().or(z.literal("")),
  cae: z.string().max(20).optional().or(z.literal("")),
  fechaVencimientoCae: z.string().optional().or(z.literal("")),
  totalGastos: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Tiene que ser ≥ 0"),
  ivaSobreGastos: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Tiene que ser ≥ 0"),
  totalTributos: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || (!isNaN(Number(v)) && Number(v) >= 0), "Tiene que ser ≥ 0"),
  comentarios: z.string().max(255).optional().or(z.literal("")),
  categorias: z.array(categoriaFacturadaSchema).min(1, "La compra no tiene categorías cargadas"),
});

export type CreateLiquidacionCompraFormValues = z.infer<typeof createLiquidacionCompraSchema>;
export type CreateLiquidacionCompraCategoriaFormValues = z.infer<typeof categoriaFacturadaSchema>;
