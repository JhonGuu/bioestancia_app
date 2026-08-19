import { and, gte, inArray, lte } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { CreateFichajeInput, FichajeRepository } from "@/modules/personal/domain/fichaje.repository";
import { Fichaje } from "@/modules/personal/domain/fichaje";
import { fichajes } from "@/modules/personal/infra/database/schema";

@injectable()
export class FichajeRepositoryDrizzle implements FichajeRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async createMany(inputs: CreateFichajeInput[]): Promise<Fichaje[]> {
    if (inputs.length === 0) return [];
    const rows = await this.orm.db
      .insert(fichajes)
      .values(
        inputs.map((input) => ({
          empresaId: input.empresaId,
          empleadoId: input.empleadoId,
          momento: input.momento,
          tipo: input.tipo,
          origen: input.origen,
        })),
      )
      .returning();
    return rows.map((row) => this.toDomain(row));
  }

  async listByEmpleadosEnRango(empleadoIds: string[], desde: Date, hasta: Date): Promise<Fichaje[]> {
    if (empleadoIds.length === 0) return [];
    const rows = await this.orm.db
      .select()
      .from(fichajes)
      .where(
        and(inArray(fichajes.empleadoId, empleadoIds), gte(fichajes.momento, desde), lte(fichajes.momento, hasta)),
      );
    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: typeof fichajes.$inferSelect): Fichaje {
    return {
      id: row.id,
      empresaId: row.empresaId,
      empleadoId: row.empleadoId,
      momento: row.momento,
      tipo: row.tipo as Fichaje["tipo"],
      origen: row.origen as Fichaje["origen"],
      createdAt: row.createdAt,
    };
  }
}
