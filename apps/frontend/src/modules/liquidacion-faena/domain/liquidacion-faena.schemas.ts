import { z } from "zod";

/**
 * Espejo de `LiquidacionFaenaValidation.create` en el backend
 * (`apps/backend/src/modules/liquidacion-faena/infra/http/validation.ts`).
 *
 * `canonPorAnimal` queda como `string` (no `z.coerce.number()`) — mismo
 * criterio que en `resultado-faena.schemas.ts`.
 */
const categoriaCanonSchema = z.object({
  compraCategoriaId: z.string().uuid(),
  // $/animal — ya combina lo facturado + lo efectivo, no se separan.
  canonPorAnimal: z
    .string()
    .min(1, "Requerido")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Tiene que ser mayor a 0"),
});

export const createLiquidacionFaenaSchema = z.object({
  frigorificoId: z.string().uuid().optional().or(z.literal("")),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  comentarios: z.string().max(255).optional().or(z.literal("")),
  categorias: z.array(categoriaCanonSchema).min(1, "La compra no tiene categorías cargadas"),
});

export type CreateLiquidacionFaenaFormValues = z.infer<typeof createLiquidacionFaenaSchema>;
export type CreateLiquidacionFaenaCategoriaFormValues = z.infer<typeof categoriaCanonSchema>;
