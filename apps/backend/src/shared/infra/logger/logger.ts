import pino, { Logger as PinoLib } from "pino";
import { injectable } from "inversify";

import { Env } from "@/shared/infra/env/env";

/**
 * Interface del logger usada por toda la app.
 * Acepta tanto un string como un objeto con metadatos + un mensaje.
 *
 * Ejemplos:
 *   logger.info("Server started");
 *   logger.info({ userId: "123" }, "User logged in");
 *   logger.error({ err }, "Unexpected error");
 */
export interface Logger {
  trace(msg: string): void;
  trace(obj: object, msg?: string): void;

  debug(msg: string): void;
  debug(obj: object, msg?: string): void;

  info(msg: string): void;
  info(obj: object, msg?: string): void;

  warn(msg: string): void;
  warn(obj: object, msg?: string): void;

  error(msg: string): void;
  error(obj: object, msg?: string): void;

  fatal(msg: string): void;
  fatal(obj: object, msg?: string): void;
}

/**
 * Implementación basada en Pino.
 *
 * - En local/dev: usa pino-pretty para output legible y coloreado.
 * - En production: JSON estructurado, ideal para herramientas de logs (Datadog, etc).
 */
@injectable()
export class PinoLogger implements Logger {
  private readonly pino: PinoLib;

  constructor() {
    const isProduction = Env.environment === "production";
    this.pino = pino({
      level: Env.logLevel,
      ...(isProduction
        ? {}
        : {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "SYS:HH:MM:ss",
                ignore: "pid,hostname",
              },
            },
          }),
    });
  }

  trace(arg1: string | object, arg2?: string): void {
    typeof arg1 === "string" ? this.pino.trace(arg1) : this.pino.trace(arg1, arg2);
  }
  debug(arg1: string | object, arg2?: string): void {
    typeof arg1 === "string" ? this.pino.debug(arg1) : this.pino.debug(arg1, arg2);
  }
  info(arg1: string | object, arg2?: string): void {
    typeof arg1 === "string" ? this.pino.info(arg1) : this.pino.info(arg1, arg2);
  }
  warn(arg1: string | object, arg2?: string): void {
    typeof arg1 === "string" ? this.pino.warn(arg1) : this.pino.warn(arg1, arg2);
  }
  error(arg1: string | object, arg2?: string): void {
    typeof arg1 === "string" ? this.pino.error(arg1) : this.pino.error(arg1, arg2);
  }
  fatal(arg1: string | object, arg2?: string): void {
    typeof arg1 === "string" ? this.pino.fatal(arg1) : this.pino.fatal(arg1, arg2);
  }
}
