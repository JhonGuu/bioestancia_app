import express, {
  Express,
  NextFunction,
  Request,
  Response,
} from "express";
import cors from "cors";
import { inject, injectable } from "inversify";
import { ZodError, ZodSchema } from "zod";

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

/** Auth de un endpoint: público o requiere JWT. */
export type AuthType = "public" | "jwt";

export interface HandlerInput {
  body: unknown;
  params: Record<string, string>;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
  /** Si el endpoint requiere JWT, acá viene el usuario autenticado. */
  auth?: { userId: string; role: string };
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
   * Lista de roles permitidos. Solo se considera si auth === "jwt".
   * - Vacío o undefined: cualquier usuario autenticado.
   * - Con valores: el rol del usuario tiene que estar en la lista, sino 403.
   */
  roles?: string[];
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
  }

  register(params: RegisterRouteParams): void {
    const { method, url, validation, auth = "public", roles, handler } = params;

    const validationMiddleware = this.buildValidationMiddleware(validation);
    const authMiddleware = this.buildAuthMiddleware(auth, roles);

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
          auth: (req as Request & { auth?: { userId: string; role: string } }).auth,
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
      validationMiddleware,
      authMiddleware,
      routeHandler,
    );
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
   * Flujo cuando auth === "jwt":
   *   1. Lee header `Authorization`.
   *   2. Decodifica JWT → obtiene userId.
   *   3. Llama a AuthProvider para obtener role + isActive desde la DB.
   *   4. Si el usuario no existe o está desactivado → 401.
   *   5. Si se pidieron roles específicos y el del usuario no está → 403.
   *   6. Si todo OK, mete `{ userId, role }` en req.auth y sigue.
   */
  private buildAuthMiddleware(auth: AuthType, allowedRoles?: string[]) {
    return async (
      req: Request,
      _res: Response,
      next: NextFunction,
    ): Promise<void> => {
      if (auth === "public") {
        next();
        return;
      }
      // auth === "jwt"
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

      const user = await this.authProvider.getAuthenticatedUser(payload.id);
      if (!user || !user.isActive) {
        next(new ApiError("Unauthorized", Code.UNAUTHORIZED));
        return;
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        next(
          new ApiError(
            `Forbidden: requiere uno de los roles [${allowedRoles.join(", ")}]`,
            Code.FORBIDDEN,
          ),
        );
        return;
      }

      (req as Request & { auth?: { userId: string; role: string } }).auth = {
        userId: user.id,
        role: user.role,
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
