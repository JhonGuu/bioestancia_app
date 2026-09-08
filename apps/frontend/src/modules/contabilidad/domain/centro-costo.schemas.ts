import { z } from "zod";

/** Espejo de `ContabilidadValidation.crearCentroCosto` en el backend. */
export const centroCostoSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio").max(20),
  nombre: z.string().min(1, "El nombre es obligatorio").max(150),
});
export type CentroCostoFormValues = z.infer<typeof centroCostoSchema>;
