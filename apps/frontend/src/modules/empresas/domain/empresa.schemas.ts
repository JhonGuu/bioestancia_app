import { z } from "zod";

/**
 * Espejo de `EmpresaValidation.update` en el backend
 * (`apps/backend/src/modules/empresas/infra/http/validation.ts`). Solo cuit/
 * teléfono/dirección son editables acá — `razonSocial`/`rubro` son
 * estructurales, no se tocan desde esta pantalla.
 */
export const updateEmpresaSchema = z.object({
  cuit: z.string().max(20).optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  direccion: z.string().max(255).optional().or(z.literal("")),
});

export type UpdateEmpresaFormValues = z.infer<typeof updateEmpresaSchema>;
