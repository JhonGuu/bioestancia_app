import { z } from "zod";

/**
 * Espejo de `UserValidation.signIn` en el backend
 * (`apps/backend/src/modules/users/infra/http/validation.ts`).
 */
export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Password requerido"),
});

export type SignInFormValues = z.infer<typeof signInSchema>;
