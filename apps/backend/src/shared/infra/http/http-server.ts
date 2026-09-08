import express, {
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import { inject, injectable } from "inversify";
import { ZodError, ZodSchema } from "zod";
import swaggerUi from "swagger-ui-express";

import { AuthProvider } from "@/shared/infra/auth/auth-provider";
import { DI_TYPES } from "@/shared/infra/di/types";
import { JWTProvider } from "@/shared/infra/jwt/jwt-provider";
import { Logger } from "@/shared/infra/logger/logger";
import {
  ApiError,
  ApiResponse,
  Code,
  FileResponse,
} from "@/shared/infra/http/api.responses";

/**
 * Auth de un endpoint:
 *   - "public": sin autenticación.
 *   - "jwt": requiere JWT válido, sin contexto de empresa (ej. /account/me,
 *     /account/empresas — endpoints que no operan datos de una empresa puntual).
 *   - "jwt-empresa": requiere JWT válido + header `X-Empresa-Id` con una empresa
 *     a la que el usuario tenga acceso. Resuelve el rol EN ESA empresa. Es lo que
 *     usan todos los endpoints de negocio (ventas, gastos, faena, etc).
 */
export type AuthType = "public" | "jwt" | "jwt-empresa";

/** Contexto de autenticación disponible en el handler, según el AuthType de la ruta. */
export interface AuthContext {
  userId: string;
  /** Solo presente si auth === "jwt-empresa". */
  empresaId?: string;
  /** Solo presente si auth === "jwt-empresa". */
  rol?: string;
  /**
   * Códigos de permiso granular del usuario en la empresa activa (ver
   * `modules/permisos/domain/permiso.ts`). Solo presente si auth === "jwt-empresa".
   */
  permisos?: string[];
}

export interface HandlerInput {
  body: unknown;
  params: Record<string, string>;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  /** Si el endpoint requiere JWT, acá viene el usuario autenticado. */
  auth?: AuthContext;
  /** Solo presente en rutas que declaran `middlewares` con multer (subida de archivos, ver `RegisterRouteParams.middlewares`). */
  file?: Express.Multer.File;
}

export interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export interface RegisterRouteParams {
  method: "get" | "post" | "put" | "patch" | "delete";
  url: string;
  validation?: ValidationSchemas;
  auth?: AuthType;
  /**
   * Lista de roles permitidos. Solo tiene efecto si auth === "jwt-empresa"
   * (el rol se resuelve sobre la empresa activa).
   * - Vacío o undefined: cualquier usuario con acceso a la empresa activa.
   * - Con valores: el rol del usuario en esa empresa tiene que estar en la lista, sino 403.
   */
  roles?: string[];
  /**
   * Lista de permisos granulares requeridos (ver `modules/permisos/domain/permiso.ts`).
   * Solo tiene efecto si auth === "jwt-empresa". Es una capa ORTOGONAL a `roles`
   * — ambas se chequean si están presentes (rol Y permisos, no rol O permisos).
   * - Vacío o undefined: no se exige ningún permiso puntual.
   * - Con valores: el usuario tiene que tener TODOS los permisos listados en esa
   *   empresa, sino 403. Pensado para las vistas/informes sensibles que el admin
   *   habilita persona por persona (ver `modules/permisos`), a diferencia de
   *   `roles`, que es fijo por categoría de usuario.
   */
  permisos?: string[];
  /**
   * Middlewares de Express adicionales, aplicados ANTES de la validación y
   * autenticación — pensado para `multer` (subida de archivos vía
   * `multipart/form-data`, que `express.json()` no puede parsear). El archivo
   * subido queda disponible en el handler como `input.file`.
   */
  middlewares?: RequestHandler[];
  handler: (input: HandlerInput) => Promise<ApiResponse | unknown>;
}

@injectable()
export class ExpressAdapter {
  private readonly app: Express;

  constructor(
    @inject(DI_TYPES.JWTProvider) private readonly jwtProvider: JWTProvider,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
    @inject(DI_TYPES.AuthProvider) private readonly authProvider: AuthProvider,
  ) {
    this.app = express();
    this.app.use(cors());
    this.app.use(express.json());
    // Protege contra bugs o clientes que disparen ráfagas de peticiones: en un
    // hosting de servidor fijo (Fly.io, etc.) esto no cambia la factura, pero
    // sí puede tirar abajo el servidor o volverlo inutilizable para todos.
    this.app.use(
      rateLimit({
        windowMs: 60_000, // 1 minuto
        limit: 200, // 200 peticiones por IP por minuto
        standardHeaders: true, // expone RateLimit-* en la respuesta
        legacyHeaders: false,
        handler: (_req, res) => {
          res.status(Code.TOO_MANY_REQUESTS).json({
            status: Code.TOO_MANY_REQUESTS,
            message: "Demasiadas peticiones. Esperá un minuto e intentá de nuevo.",
          });
        },
      }),
    );
  }

  register(params: RegisterRouteParams): void {
    const { method, url, validation, auth = "public", roles, permisos, middlewares, handler } = params;

    const validationMiddleware = this.buildValidationMiddleware(validation);
    const authMiddleware = this.buildAuthMiddleware(auth, roles, permisos);

    const routeHandler = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const result = await handler({
          body: req.body,
          params: req.params as Record<string, string>,
          query: req.query as Record<string, unknown>,
          headers: req.headers,
          auth: (req as Request & { auth?: AuthContext }).auth,
          file: (req as Request & { file?: Express.Multer.File }).file,
        });

        if (result instanceof ApiResponse) {
          res.status(result.status).json(result);
          return;
        }
        if (result instanceof FileResponse) {
          res.setHeader("Content-Type", result.contentType);
          res.setHeader(
            "Content-Disposition",
            `${result.disposition}; filename="${result.filename}"`,
          );
          res.send(result.buffer);
          return;
        }
        res.status(Code.OK).json(new ApiResponse({ data: result }));
      } catch (error) {
        next(error);
      }
    };

    this.app[method](
      `/api${url}`,
      ...(middlewares ?? []),
      validationMiddleware,
      authMiddleware,
      routeHandler,
    );
  }

  /**
   * Monta Swagger UI sirviendo un documento OpenAPI ya generado (ver
   * `shared/infra/openapi/generate-document.ts`). Es la única ruta que no pasa
   * por `register()` — swagger-ui-express necesita acceso directo al `Express`
   * subyacente para sus propios middlewares de servir HTML/assets.
   *
   * También expone el JSON crudo en `${path}.json` (útil para importar en
   * Postman/Insomnia con "Import from URL").
   */
  mountOpenApiDocs(path: string, document: object): void {
    this.app.use(path, swaggerUi.serve, swaggerUi.setup(document));
    this.app.get(`${path}.json`, (_req, res) => {
      res.json(document);
    });
  }

  async listen(port: number): Promise<void> {
    this.app.use(this.errorMiddleware);

    return new Promise((resolve) => {
      this.app.listen(port, () => {
        this.logger.info(`HTTP server listening on port ${port}`);
        resolve();
      });
    });
  }

  // ────────────────────────────────────────────────────────────
  // Middlewares (privados)
  // ────────────────────────────────────────────────────────────

  private buildValidationMiddleware(validation?: ValidationSchemas) {
    return async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (!validation) {
        next();
        return;
      }
      try {
        if (validation.body) req.body = await validation.body.parseAsync(req.body);
        if (validation.params) req.params = await validation.params.parseAsync(req.params);
        if (validation.query) req.query = await validation.query.parseAsync(req.query);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(Code.BAD_REQUEST).json({
            status: Code.BAD_REQUEST,
            message: "Validation failed",
            errors: error.errors.map((e) => ({
              path: e.path.join("."),
              message: e.message,
            })),
          });
          return;
        }
        next(error);
      }
    };
  }

  /**
   * Middleware de auth.
   *
   * Flujo cuando auth === "jwt" o "jwt-empresa":
   *   1. Lee header `Authorization`, decodifica el JWT → obtiene userId.
   *   2. Llama a AuthProvider.getIdentity() → si no existe o está desactivado, 401.
   *   3. Si auth === "jwt", listo: mete `{ userId }` en req.auth y sigue (no hay
   *      contexto de empresa, así que `roles`/`permisos` no se evalúan).
   *   4. Si auth === "jwt-empresa": lee el header `X-Empresa-Id` (400 si falta),
   *      y llama a AuthProvider.getAccessForEmpresa(userId, empresaId).
   *      Esto es lo que VALIDA que el usuario realmente tenga acceso a esa
   *      empresa — el header nunca se confía a ciegas. Si no hay acceso, 403.
   *   5. Si se pidieron roles específicos y el rol resuelto no está, 403.
   *   6. Si se pidieron permisos específicos y falta alguno, 403. Es una capa
   *      aparte de `roles` — se chequean ambas si están presentes.
   *   7. Si todo OK, mete `{ userId, empresaId, rol, permisos }` en req.auth y sigue.
   */
  private buildAuthMiddleware(auth: AuthType, allowedRoles?: string[], requiredPermisos?: string[]) {
    return async (
      req: Request,
      _res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (auth === "public") {
        next();
        return;
      }

      const header = req.headers.authorization;
      if (!header) {
        next(new ApiError("Unauthorized", Code.UNAUTHORIZED));
        return;
      }
      const token = header.startsWith("Bearer ") ? header.slice(7) : header;

      let payload: { id: string };
      try {
        payload = this.jwtProvider.decrypt(token);
      } catch {
        next(new ApiError("Unauthorized", Code.UNAUTHORIZED));
        return;
      }

      const identity = await this.authProvider.getIdentity(payload.id);
      if (!identity || !identity.isActive) {
        next(new ApiError("Unauthorized", Code.UNAUTHORIZED));
        return;
      }

      if (auth === "jwt") {
        (req as Request & { auth?: AuthContext }).auth = { userId: identity.id };
        next();
        return;
      }

      // auth === "jwt-empresa": las rutas de negocio quedan bloqueadas hasta
      // que el usuario cambie su contraseña temporal (ver ChangePassword).
      // Las rutas "jwt" puras (me, change-password) no pasan por acá, así que
      // el usuario siempre puede completar el cambio.
      if (identity.mustChangePassword) {
        next(
          new ApiError(
            "Tenés que cambiar tu contraseña antes de continuar",
            Code.FORBIDDEN,
          ),
        );
        return;
      }

      const empresaIdHeader = req.headers["x-empresa-id"];
      const empresaId = Array.isArray(empresaIdHeader) ? empresaIdHeader[0] : empresaIdHeader;
      if (!empresaId) {
        next(new ApiError("Falta el header X-Empresa-Id", Code.BAD_REQUEST));
        return;
      }

      const access = await this.authProvider.getAccessForEmpresa(identity.id, empresaId);
      if (!access) {
        next(new ApiError("No tenés acceso a esta empresa", Code.FORBIDDEN));
        return;
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(access.rol)) {
        next(
          new ApiError(
            `Forbidden: requiere uno de los roles [${allowedRoles.join(", ")}]`,
            Code.FORBIDDEN,
          ),
        );
        return;
      }

      if (requiredPermisos && requiredPermisos.length > 0) {
        const faltante = requiredPermisos.filter((p) => !access.permisos.includes(p));
        if (faltante.length > 0) {
          next(
            new ApiError(
              `Forbidden: no tenés acceso a esta vista (falta permiso: ${faltante.join(", ")})`,
              Code.FORBIDDEN,
            ),
          );
          return;
        }
      }

      (req as Request & { auth?: AuthContext }).auth = {
        userId: identity.id,
        empresaId,
        rol: access.rol,
        permisos: access.permisos,
      };
      next();
    };
  }

  private errorMiddleware = (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    if (error instanceof ApiError) {
      res.status(error.status).json({
        status: error.status,
        message: error.message,
      });
      return;
    }
    this.logger.error({ err: error }, "Unhandled error in request");
    res.status(Code.INTERNAL_SERVER_ERROR).json({
      status: Code.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  };
}
