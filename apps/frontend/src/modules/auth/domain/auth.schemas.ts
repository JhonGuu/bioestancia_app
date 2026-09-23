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

/**
 * Espejo de `UserValidation.changePassword` en el backend. Se usa tanto para
 * el cambio voluntario como para el cambio forzado del primer login.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Contraseña actual requerida"),
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72),
    confirmNewPassword: z.string().min(1, "Confirmá la contraseña nueva"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

/**
 * Espejo de `UserValidation.updateMyAccount` en el backend. El teléfono es
 * opcional: vacío lo borra.
 */
export const updateMyAccountSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  lastName: z.string().trim().min(1, "El apellido es obligatorio").max(100),
  phoneNumber: z.string().trim().regex(/^[0-9]*$/, "Solo números, sin espacios ni guiones").max(20),
});

export type UpdateMyAccountFormValues = z.infer<typeof updateMyAccountSchema>;
