import { z } from "zod";

/**
 * Espejo de `CargoValidation.create` en el backend. `toleranciaMinutos` queda
 * como `string` (no `z.coerce.number()`) — mismo criterio que en
 * `resultado-faena.schemas.ts`: así viaja como "" cuando no se toca, y el
 * backend lo vuelve a coercionar con su propio `z.coerce.number()`.
 */
export const createCargoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  toleranciaMinutos: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || (Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= 180),
      "Tiene que ser un entero entre 0 y 180",
    ),
});

export type CreateCargoFormValues = z.infer<typeof createCargoSchema>;
