import { z } from "zod";

/**
 * Envuelve un schema de `data` con la forma estándar de respuesta de la API
 * (`ApiResponse` — ver shared/infra/http/api.responses.ts): `{ status, message, data }`.
 */
export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    status: z.number().openapi({ example: 200 }),
    message: z.string(),
    data: dataSchema,
  });
}

/**
 * Schema del header `X-Empresa-Id`, requerido en todo endpoint con
 * `auth: "jwt-empresa"`. Se valida en runtime contra `usuario_empresas`
 * (ver shared/infra/http/http-server.ts) — acá solo se documenta.
 */
export const empresaIdHeaderSchema = z.object({
  "x-empresa-id": z
    .string()
    .uuid()
    .openapi({
      description:
        "Id de la empresa activa (empresas.id). El backend valida que el usuario tenga acceso a esa empresa vía usuario_empresas.",
      example: "b3f1c2a0-1234-4abc-9def-000000000000",
    }),
});
