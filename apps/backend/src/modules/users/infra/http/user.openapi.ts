import { z } from "zod";

import { registry } from "@/shared/infra/openapi/registry";
import { apiResponseSchema, empresaIdHeaderSchema } from "@/shared/infra/openapi/common";
import { UserValidation } from "@/modules/users/infra/http/validation";

// Instancia standalone solo para leer los schemas Zod ya definidos — no pasa
// por DI, no hace falta: UserValidation no tiene dependencias en su constructor.
const validation = new UserValidation();

const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().nullable(),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
  createdAt: z.string().datetime(),
});

const usuarioConAccesoSchema = z.object({
  usuarioId: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string().nullable(),
  isActive: z.boolean(),
  mustChangePassword: z.boolean(),
  rol: z.string(),
  accesoDesde: z.string().datetime(),
});

const empresaAccesoSchema = z.object({
  empresaId: z.string().uuid(),
  razonSocial: z.string(),
  rubro: z.string(),
  rol: z.string(),
});

const usuarioEmpresaSchema = z.object({
  id: z.string().uuid(),
  usuarioId: z.string().uuid(),
  empresaId: z.string().uuid(),
  rol: z.string(),
  createdAt: z.string().datetime(),
});

const signInOutputSchema = z.object({
  token: z.string(),
  empresas: z.array(empresaAccesoSchema),
});

/**
 * Registra en el OpenAPIRegistry compartido los endpoints de `users`.
 * Se llama una sola vez desde generate-document.ts, al armar la doc.
 */
export function registerUsersOpenApi(): void {
  registry.registerPath({
    method: "post",
    path: "/account/signup",
    tags: ["Auth"],
    summary: "Crea un usuario nuevo, sin acceso a ninguna empresa todavía",
    request: {
      body: { content: { "application/json": { schema: validation.signUp.body } } },
    },
    responses: {
      201: {
        description: "Usuario creado",
        content: { "application/json": { schema: apiResponseSchema(userSchema) } },
      },
      409: { description: "Email o username ya está en uso" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/account/signin",
    tags: ["Auth"],
    summary: "Login. Devuelve el JWT y las empresas a las que el usuario tiene acceso",
    request: {
      body: { content: { "application/json": { schema: validation.signIn.body } } },
    },
    responses: {
      200: {
        description: "Login exitoso",
        content: { "application/json": { schema: apiResponseSchema(signInOutputSchema) } },
      },
      401: { description: "Credenciales inválidas" },
      403: { description: "Cuenta desactivada" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/account/me",
    tags: ["Auth"],
    summary: "Perfil del usuario autenticado (no depende de empresa activa)",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(userSchema) } },
      },
      401: { description: "No autenticado" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/account/empresas",
    tags: ["Auth"],
    summary: "Empresas a las que el usuario autenticado tiene acceso, con su rol en cada una",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(empresaAccesoSchema)) } },
      },
      401: { description: "No autenticado" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/account/users",
    tags: ["Usuarios y accesos (admin)"],
    summary:
      "Crea un usuario NUEVO y le otorga acceso a la empresa activa (X-Empresa-Id) con un rol. Solo admin de esa empresa. La contraseña la genera el sistema y se devuelve una sola vez.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.createUserByAdmin.body } } },
    },
    responses: {
      201: {
        description: "Usuario creado y acceso otorgado",
        content: {
          "application/json": {
            schema: apiResponseSchema(
              z.object({
                user: userSchema,
                acceso: usuarioEmpresaSchema,
                temporaryPassword: z.string(),
              }),
            ),
          },
        },
      },
      403: { description: "No sos admin de la empresa activa" },
      409: { description: "Email o username ya está en uso" },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/account/users",
    tags: ["Usuarios y accesos (admin)"],
    summary: "Lista los usuarios con acceso a la empresa activa (X-Empresa-Id), con su rol. Solo admin.",
    security: [{ bearerAuth: [] }],
    request: { headers: empresaIdHeaderSchema },
    responses: {
      200: {
        description: "OK",
        content: { "application/json": { schema: apiResponseSchema(z.array(usuarioConAccesoSchema)) } },
      },
      403: { description: "No sos admin de la empresa activa" },
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/account/users/{userId}/estado",
    tags: ["Usuarios y accesos (admin)"],
    summary:
      "Activa o desactiva un usuario con acceso a la empresa activa (X-Empresa-Id). Solo admin. No podés desactivarte a vos mismo.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      params: z.object({ userId: z.string().uuid() }),
      body: { content: { "application/json": { schema: z.object({ isActive: z.boolean() }) } } },
    },
    responses: {
      200: { description: "Estado actualizado" },
      400: { description: "No podés desactivarte a vos mismo" },
      403: { description: "No sos admin de la empresa activa" },
      404: { description: "Ese usuario no tiene acceso a esta empresa" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/account/access",
    tags: ["Usuarios y accesos (admin)"],
    summary:
      "Otorga acceso a la empresa activa (X-Empresa-Id) a un usuario que YA EXISTE, buscado por email. También se usa para editar el rol de un usuario que ya tiene acceso. Solo admin de esa empresa.",
    security: [{ bearerAuth: [] }],
    request: {
      headers: empresaIdHeaderSchema,
      body: { content: { "application/json": { schema: validation.grantAccess.body } } },
    },
    responses: {
      201: {
        description: "Acceso otorgado (o rol actualizado, si ya tenía acceso)",
        content: { "application/json": { schema: apiResponseSchema(usuarioEmpresaSchema) } },
      },
      403: { description: "No sos admin de la empresa activa" },
      404: { description: "No existe un usuario con ese email" },
    },
  });

  registry.registerPath({
    method: "post",
    path: "/account/change-password",
    tags: ["Auth"],
    summary:
      "Cambia la contraseña del usuario autenticado. Requerido antes de operar cualquier ruta de empresa si mustChangePassword está en true.",
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: validation.changePassword.body } } },
    },
    responses: {
      200: { description: "Contraseña actualizada" },
      401: { description: "La contraseña actual no es correcta" },
    },
  });
}
