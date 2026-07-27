import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

/**
 * Le suma el método `.openapi(...)` a los schemas Zod (para agregar descripción,
 * ejemplos, etc). TIENE que correr antes de que cualquier archivo llame
 * `.openapi()` sobre un schema — por eso vive acá arriba de todo, y cualquier
 * módulo que registre paths importa `registry` desde este archivo (nunca
 * `zod-to-openapi` directo), así se garantiza el orden de carga.
 */
extendZodWithOpenApi(z);

/**
 * Registro central de paths/schemas de OpenAPI. Cada módulo de dominio suma
 * sus endpoints acá vía su propio `<modulo>.openapi.ts` (ver
 * modules/users/infra/http/user.openapi.ts para el ejemplo).
 *
 * Es documentación pura: no valida requests en runtime (eso lo sigue haciendo
 * `infra/http/validation.ts` de cada módulo, como siempre). Reutilizamos los
 * mismos schemas Zod de `validation.ts` acá para no duplicarlos.
 */
export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description:
    "JWT devuelto por POST /account/signin. Mandar como header 'Authorization: Bearer <token>'.",
});
