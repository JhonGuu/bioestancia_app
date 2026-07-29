/**
 * Formas de respuesta HTTP del backend (ver
 * `apps/backend/src/shared/infra/http/api.responses.ts`).
 *
 * Éxito:   { status, message, data }
 * Error:   { status, message, errors? }  (errors solo en fallos de validación Zod)
 */
export interface ApiSuccessBody<T> {
  status: number;
  message: string;
  data: T;
}

export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  status: number;
  message: string;
  errors?: ApiFieldError[];
}

/**
 * Error normalizado que lanza el http-client ante cualquier respuesta no-2xx.
 * Los hooks de TanStack Query reciben esta clase en `error`, nunca el AxiosError crudo.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(body: Partial<ApiErrorBody>, status: number) {
    super(body.message ?? "Ocurrió un error inesperado");
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = body.errors ?? [];
  }

  /** Mensaje de error para un campo puntual del formulario (ej. "email"), si vino del server. */
  fieldError(path: string): string | undefined {
    return this.fieldErrors.find((e) => e.path === path)?.message;
  }
}
