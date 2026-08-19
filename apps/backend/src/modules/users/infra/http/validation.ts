import { injectable } from "inversify";
import { z } from "zod";

import { Roles } from "@/modules/users/domain/roles";

/**
 * Schemas Zod para los endpoints del módulo users.
 */
@injectable()
export class UserValidation {
  /** Sign up público — crea el usuario sin acceso a ninguna empresa todavía. */
  signUp = {
    body: z.object({
      email: z.string().email("Email inválido").max(255),
      username: z
        .string()
        .min(3, "El username debe tener al menos 3 caracteres")
        .max(100),
      password: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(72, "La contraseña excede el máximo permitido (72)"),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      phoneNumber: z
        .string()
        .regex(/^[0-9]+$/, "Solo números")
        .max(20)
        .optional(),
    }),
  };

  /**
   * Creación de usuario por admin — crea el user Y le otorga acceso a la
   * empresa activa (la del header X-Empresa-Id) con el rol indicado, en un
   * solo paso. No recibe `password`: el sistema genera una temporal (ver
   * `generateTempPassword`) que se muestra una sola vez en la respuesta.
   */
  createUserByAdmin = {
    body: z.object({
      email: z.string().email("Email inválido").max(255),
      username: z.string().min(3).max(100),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      phoneNumber: z.string().regex(/^[0-9]+$/).max(20).optional(),
      rol: z.nativeEnum(Roles),
    }),
  };

  /** Otorgar acceso a la empresa activa a un usuario que ya existe (por email). También se usa para editar el rol de un usuario que ya tiene acceso. */
  grantAccess = {
    body: z.object({
      email: z.string().email("Email inválido"),
      rol: z.nativeEnum(Roles),
    }),
  };

  signIn = {
    body: z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Password requerido"),
    }),
  };

  /** Activar/desactivar un usuario con acceso a la empresa activa. */
  setUserActive = {
    params: z.object({ userId: z.string().uuid() }),
    body: z.object({ isActive: z.boolean() }),
  };

  /** Cambio de contraseña del usuario autenticado (voluntario o forzado por `mustChangePassword`). */
  changePassword = {
    body: z.object({
      currentPassword: z.string().min(1, "Contraseña actual requerida"),
      newPassword: z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(72, "La contraseña excede el máximo permitido (72)"),
    }),
  };
}
