import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateResultadoFaenaInput,
  ResultadoFaenaRepository,
} from "@/modules/resultado-faena/domain/resultado-faena.repository";
import { ResultadoFaena } from "@/modules/resultado-faena/domain/resultado-faena";
import { resultadoFaena } from "@/modules/resultado-faena/infra/database/schema";

@injectable()
export class ResultadoFaenaRepositoryDrizzle implements ResultadoFaenaRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<ResultadoFaena | null> {
    const [row] = await this.orm.db
      .select()
      .from(resultadoFaena)
      .where(
        and(
          eq(resultadoFaena.id, id),
          eq(resultadoFaena.empresaId, empresaId),
          isNull(resultadoFaena.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async getByCompraId(compraId: string, empresaId: string): Promise<ResultadoFaena | null> {
    const [row] = await this.orm.db
      .select()
      .from(resultadoFaena)
      .where(
        and(
          eq(resultadoFaena.compraId, compraId),
          eq(resultadoFaena.empresaId, empresaId),
          isNull(resultadoFaena.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateResultadoFaenaInput): Promise<ResultadoFaena> {
    const [row] = await this.orm.db
      .insert(resultadoFaena)
      .values({
        empresaId: input.empresaId,
        compraId: input.compraId,
        fechaFaena: input.fechaFaena,
        numero: input.numero ?? null,
        numeroAutorizacion: input.numeroAutorizacion ?? null,
        kgVivoTotal: String(input.kgVivoTotal),
        kgCarneTotal: String(input.kgCarneTotal),
        comisosKg: String(input.comisosKg),
        comisosCabezas: input.comisosCabezas,
        rendimiento: String(input.rendimiento),
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create resultado de faena", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof resultadoFaena.$inferSelect): ResultadoFaena {
    return {
      id: row.id,
      compraId: row.compraId,
      fechaFaena: row.fechaFaena,
      numero: row.numero,
      numeroAutorizacion: row.numeroAutorizacion,
      kgVivoTotal: Number(row.kgVivoTotal),
      kgCarneTotal: Number(row.kgCarneTotal),
      comisosKg: Number(row.comisosKg),
      comisosCabezas: row.comisosCabezas,
      rendimiento: Number(row.rendimiento),
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
