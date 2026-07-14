// Polyfill de Reflect.metadata. TIENE que ser el primer import del proyecto.
// Sin esto, los decoradores @injectable / @inject de Inversify no funcionan.
import "reflect-metadata";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { Env } from "@/shared/infra/env/env";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { Logger } from "@/shared/infra/logger/logger";

async function bootstrap(): Promise<void> {
  const container = DI.getInstance().container;

  const logger = container.get<Logger>(DI_TYPES.Logger);
  const db = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);
  const httpServer = container.get<ExpressAdapter>(DI_TYPES.HttpServer);

  // 1. Inicializar DB (por ahora no hace nada, pero deja el hook listo)
  await db.init();
  logger.info({ env: Env.environment }, "Database connection ready");

  // 2. Levantar server
  await httpServer.listen(Env.port);

  // 3. Hooks de shutdown limpio
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
