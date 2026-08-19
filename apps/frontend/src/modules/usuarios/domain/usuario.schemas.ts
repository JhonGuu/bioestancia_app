import { z } from "zod";

import { Roles } from "@/modules/auth/domain/auth.types";

const rolesValues = Object.values(Roles) as [Roles, ...Roles[]];

/** Espejo de `UserValidation.createUserByAdmin` en el backend (sin `password`: la genera el sistema). */
export const crearUsuarioSchema = z.object({
  firstName: z.string().min(1, "Requerido").max(100),
  lastName: z.string().min(1, "Requerido").max(100),
  email: z.string().email("Email inválido").max(255),
  username: z.string().min(3, "Mínimo 3 caracteres").max(100),
  phoneNumber: z
    .string()
    .regex(/^[0-9]*$/, "Solo números")
    .max(20)
    .optional()
    .or(z.literal("")),
  rol: z.enum(rolesValues),
});

export type CrearUsuarioFormValues = z.infer<typeof crearUsuarioSchema>;

/** Espejo de `UserValidation.grantAccess` — también se usa para editar el rol de un usuario existente. */
export const editarRolSchema = z.object({
  email: z.string().email(),
  rol: z.enum(rolesValues),
});

export type EditarRolFormValues = z.infer<typeof editarRolSchema>;
