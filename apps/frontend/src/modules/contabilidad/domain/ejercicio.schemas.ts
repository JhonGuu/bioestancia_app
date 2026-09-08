import { z } from "zod";

/** Espejo de `ContabilidadValidation.crearEjercicio` en el backend. */
export const ejercicioSchema = z
  .object({
    nombre: z.string().max(100).optional().or(z.literal("")),
    fechaInicio: z.string().min(1, "Elegí la fecha de inicio"),
    fechaFin: z.string().min(1, "Elegí la fecha de cierre"),
  })
  .refine((data) => new Date(data.fechaFin) > new Date(data.fechaInicio), {
    message: "La fecha de cierre tiene que ser posterior a la de inicio",
    path: ["fechaFin"],
  });
export type EjercicioFormValues = z.infer<typeof ejercicioSchema>;
