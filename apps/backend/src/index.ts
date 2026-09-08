// Polyfill de Reflect.metadata. TIENE que ser el primer import del proyecto.
// Sin esto, los decoradores @injectable / @inject de Inversify no funcionan.
import "reflect-metadata";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { Env } from "@/shared/infra/env/env";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { Logger } from "@/shared/infra/logger/logger";
import { generateOpenApiDocument } from "@/shared/infra/openapi/generate-document";

async function bootstrap(): Promise<void> {
  // Antes que nada: si esto es producción, que falle acá con un mensaje
  // claro (JWT_SECRET de ejemplo, o falta FRONTEND_URL) en vez de arrancar
  // "andando" con un agujero de seguridad silencioso.
  Env.validate();

  const container = DI.getInstance().container;

  const logger = container.get<Logger>(DI_TYPES.Logger);
  const db = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);
  const httpServer = container.get<ExpressAdapter>(DI_TYPES.HttpServer);

  // 1. Inicializar DB (por ahora no hace nada, pero deja el hook listo)
  await db.init();
  logger.info({ env: Env.environment }, "Database connection ready");

  // 2. Documentación OpenAPI/Swagger (/api/docs) — se arma a partir de los
  //    schemas Zod que ya usa cada módulo para validar requests.
  httpServer.mountOpenApiDocs("/api/docs", generateOpenApiDocument());

  // 3. Levantar server
  await httpServer.listen(Env.port);
  logger.info(`Docs disponibles en http://localhost:${Env.port}/api/docs`);

  // 4. Hooks de shutdown limpio
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Received shutdown signal, closing connections...");
    try {
      await db.close();
      logger.info("Database connection closed. Bye!");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
