import { injectable } from "inversify";
import { z } from "zod";

import { Roles } from "@/modules/users/domain/roles";

/**
 * Schemas Zod para los endpoints del módulo users.
 */
@injectable()
export class UserValidation {
  /** Sign up público — por ahora siempre crea ADMIN (único rol existente). */
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

  /** Creación de usuarios por admin — permite especificar rol (útil cuando sumes roles nuevos). */
  createUserByAdmin = {
    body: z.object({
      email: z.string().email("Email inválido").max(255),
      username: z
        .string()
        .min(3)
        .max(100),
      password: z
        .string()
        .min(8)
        .max(72),
      firstName: z.string().min(1).max(100),
      lastName: z.string().min(1).max(100),
      phoneNumber: z.string().regex(/^[0-9]+$/).max(20).optional(),
      role: z.nativeEnum(Roles),
    }),
  };

  signIn = {
    body: z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Password requerido"),
    }),
  };
}
