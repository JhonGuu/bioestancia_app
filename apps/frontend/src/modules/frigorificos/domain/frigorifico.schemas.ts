import { z } from "zod";

/** Espejo de `FrigorificoValidation.create` en el backend. */
export const createFrigorificoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(255),
  cuit: z.string().max(20).optional().or(z.literal("")),
  senasaNumero: z.string().max(30).optional().or(z.literal("")),
  rucaNumero: z.string().max(30).optional().or(z.literal("")),
});

export type CreateFrigorificoFormValues = z.infer<typeof createFrigorificoSchema>;
