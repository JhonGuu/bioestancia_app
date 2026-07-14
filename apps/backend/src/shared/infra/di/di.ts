import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { JsonWebTokenProvider } from "@/shared/infra/jwt/jwt-provider";
import { PinoLogger } from "@/shared/infra/logger/logger";
import { registerUsersModule } from "@/modules/users/users.module";

/**
 * Contenedor central de inyección de dependencias.
 *
 * Patrón Singleton: una sola instancia para toda la app.
 * Se accede con `DI.getInstance().container`.
 *
 * Cada módulo de dominio tiene su propia función `register<Modulo>Module(container)`
 * que registra sus dependencias. Esas funciones se invocan acá en `init()`.
 */
export class DI {
  private static instance: DI | null = null;

  readonly container: Container;

  private constructor() {
    this.container = new Container({ defaultScope: "Singleton" });
    this.init();
  }

  static getInstance(): DI {
    if (!DI.instance) {
      DI.instance = new DI();
    }
    return DI.instance;
  }

  private init(): void {
    this.registerSharedInfra();

    // Módulos de dominio
    registerUsersModule(this.container);
    // Cuando agregues un módulo nuevo (ej. granjas, lotes, sanidad):
    // registerNuevoModulo(this.container);
  }

  private registerSharedInfra(): void {
    // Logger primero (otras deps lo usan en su constructor)
    this.container.bind(DI_TYPES.Logger).to(PinoLogger);

    // JWT provider
    this.container.bind(DI_TYPES.JWTProvider).to(JsonWebTokenProvider);

    // DB connection (Drizzle + postgres-js)
    this.container.bind(DI_TYPES.DBConnection).to(DrizzleAdapter);

    // HTTP server (Express)
    this.container.bind(DI_TYPES.HttpServer).to(ExpressAdapter);
  }
}
