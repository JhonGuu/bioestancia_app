import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres, { Sql } from "postgres";
import { injectable } from "inversify";

import { Env } from "@/shared/infra/env/env";
import * as schema from "@/shared/infra/database/schema";

/**
 * Tipo del cliente Drizzle ya inicializado con TODOS los schemas del proyecto.
 * Lo usamos en los repositorios para tener tipos correctos al hacer queries.
 */
export type DB = PostgresJsDatabase<typeof schema>;

@injectable()
export class DrizzleAdapter {
  /** Cliente postgres-js (driver de bajo nivel). Lo guardamos para poder cerrarlo. */
  private readonly client: Sql;

  /** Cliente Drizzle (es lo que se usa en los repositorios). */
  readonly db: DB;

  constructor() {
    if (Env.environment === "production") {
      // En producción usamos el pool default (típicamente 10 conexiones).
      // `prepare: false` desactiva los prepared statements, útil con poolers tipo PgBouncer.
      this.client = postgres(Env.dbUrl, { prepare: false });
    } else {
      // En desarrollo/test bajamos el pool a 1 para que las migraciones y los tests
      // no peleen entre sí por conexiones.
      this.client = postgres(Env.dbUrl, { max: 1, onnotice: () => {} });
    }
    this.db = drizzle(this.client, { schema });
  }

  /**
   * Hook para inicialización asíncrona si hace falta (ping, etc).
   * Por ahora no hace nada, pero lo dejamos para que el bootstrap pueda await-earlo.
   */
  async init(): Promise<void> {
    // intencionalmente vacío
  }

  /** Cierra la conexión. Útil en tests y al apagar el server. */
  async close(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }

  /**
   * Trunca todas las tablas (excepto `migrations`).
   * SOLO se permite en environment "test". Es un guard de seguridad.
   * Lo vamos a usar en los tests para empezar con DB limpia entre tests.
   */
  async clear(): Promise<void> {
    if (Env.environment !== "test") {
      throw new Error("DrizzleAdapter.clear() only allowed in test environment");
    }
    await this.db.execute(sql`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN
          SELECT tablename FROM pg_tables
          WHERE schemaname = 'public' AND tablename != 'migrations'
        LOOP
          EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', r.tablename);
        END LOOP;
      END
      $$;
    `);
  }
}
