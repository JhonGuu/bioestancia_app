import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateLiquidacionFaenaInput,
  LiquidacionFaenaRepository,
} from "@/modules/liquidacion-faena/domain/liquidacion-faena.repository";
import { LiquidacionFaena } from "@/modules/liquidacion-faena/domain/liquidacion-faena";
import { liquidacionFaena } from "@/modules/liquidacion-faena/infra/database/schema";

@injectable()
export class LiquidacionFaenaRepositoryDrizzle implements LiquidacionFaenaRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<LiquidacionFaena | null> {
    const [row] = await this.orm.db
      .select()
      .from(liquidacionFaena)
      .where(
        and(
          eq(liquidacionFaena.id, id),
          eq(liquidacionFaena.empresaId, empresaId),
          isNull(liquidacionFaena.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async getByCompraId(compraId: string, empresaId: string): Promise<LiquidacionFaena | null> {
    const [row] = await this.orm.db
      .select()
      .from(liquidacionFaena)
      .where(
        and(
          eq(liquidacionFaena.compraId, compraId),
          eq(liquidacionFaena.empresaId, empresaId),
          isNull(liquidacionFaena.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<LiquidacionFaena[]> {
    const rows = await this.orm.db
      .select()
      .from(liquidacionFaena)
      .where(and(eq(liquidacionFaena.empresaId, empresaId), isNull(liquidacionFaena.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateLiquidacionFaenaInput): Promise<LiquidacionFaena> {
    const [row] = await this.orm.db
      .insert(liquidacionFaena)
      .values({
        empresaId: input.empresaId,
        compraId: input.compraId,
        frigorificoId: input.frigorificoId ?? null,
        fecha: input.fecha,
        comentarios: input.comentarios ?? null,
        total: String(input.total),
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create liquidación de faena", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof liquidacionFaena.$inferSelect): LiquidacionFaena {
    return {
      id: row.id,
      compraId: row.compraId,
      frigorificoId: row.frigorificoId,
      fecha: row.fecha,
      comentarios: row.comentarios,
      total: Number(row.total),
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
