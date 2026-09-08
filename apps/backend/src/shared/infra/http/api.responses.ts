/**
 * Códigos HTTP que usamos en la app.
 * Centralizar acá evita "magic numbers" tipo `res.status(404)` regados por todos lados.
 */
export enum Code {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
}

/**
 * Forma estándar en que respondemos cuando todo sale bien.
 * El frontend siempre recibe `{ status, message, data }`.
 *
 * Genérico en T: `new ApiResponse<User>({ data: usuario })` → tipa `data` como User.
 */
export class ApiResponse<T = unknown> {
  status: Code;
  message: string;
  data: T | null;

  constructor(params: { status?: Code; message?: string; data?: T }) {
    this.status = params.status ?? Code.OK;
    this.message = params.message ?? "Success";
    this.data = params.data ?? null;
  }
}

/**
 * Excepción de dominio HTTP. La idea es que cualquier capa (use-case, repository)
 * puede lanzar `throw new ApiError("...", Code.NOT_FOUND)` sin saber nada de Express.
 *
 * El HttpServer la captura en su middleware de errores y la traduce en respuesta HTTP.
 */
export class ApiError extends Error {
  status: Code;
  data: null;

  constructor(message: string, status: Code = Code.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = null;
  }
}

/**
 * Respuesta binaria para devolver archivos (PDFs, Excels, etc).
 * El HttpServer detecta esta instancia y setea los headers correctos.
 */
export class FileResponse {
  constructor(
    readonly buffer: Buffer,
    readonly filename: string,
    readonly contentType: string = "application/pdf",
    /** "inline" abre en el browser, "attachment" fuerza descarga. */
    readonly disposition: "inline" | "attachment" = "inline",
  ) {}
}
