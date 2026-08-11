import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { BoletaRepository, CreateBoletaInput } from "@/modules/boletas/domain/boleta.repository";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { boletas } from "@/modules/boletas/infra/database/schema";

@injectable()
export class BoletaRepositoryDrizzle implements BoletaRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Boleta | null> {
    const [row] = await this.orm.db
      .select()
      .from(boletas)
      .where(and(eq(boletas.id, id), eq(boletas.empresaId, empresaId), isNull(boletas.deletedAt)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<Boleta[]> {
    const rows = await this.orm.db
      .select()
      .from(boletas)
      .where(and(eq(boletas.empresaId, empresaId), isNull(boletas.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async listByRango(empresaId: string, desde: Date, hasta: Date): Promise<Boleta[]> {
    const rows = await this.orm.db
      .select()
      .from(boletas)
      .where(
        and(
          eq(boletas.empresaId, empresaId),
          gte(boletas.fecha, desde),
          lt(boletas.fecha, hasta),
          isNull(boletas.deletedAt),
        ),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateBoletaInput): Promise<Boleta> {
    const [row] = await this.orm.db
      .insert(boletas)
      .values({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        fecha: input.fecha,
        numero: input.numero ?? null,
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create boleta", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof boletas.$inferSelect): Boleta {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId,
      fecha: row.fecha,
      numero: row.numero,
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
