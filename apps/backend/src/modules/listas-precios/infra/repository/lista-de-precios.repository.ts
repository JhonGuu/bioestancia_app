import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateListaDePreciosInput,
  ListaDePreciosRepository,
} from "@/modules/listas-precios/domain/lista-de-precios.repository";
import { ListaDePrecios } from "@/modules/listas-precios/domain/lista-de-precios";
import { listasDePrecios } from "@/modules/listas-precios/infra/database/schema";

@injectable()
export class ListaDePreciosRepositoryDrizzle implements ListaDePreciosRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  async getById(id: string, empresaId: string): Promise<ListaDePrecios | null> {
    const [row] = await this.orm.db
      .select()
      .from(listasDePrecios)
      .where(
        and(
          eq(listasDePrecios.id, id),
          eq(listasDePrecios.empresaId, empresaId),
          isNull(listasDePrecios.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<ListaDePrecios[]> {
    const rows = await this.orm.db
      .select()
      .from(listasDePrecios)
      .where(
        and(
          eq(listasDePrecios.empresaId, empresaId),
          eq(listasDePrecios.activa, true),
          isNull(listasDePrecios.deletedAt),
        ),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateListaDePreciosInput): Promise<ListaDePrecios> {
    const [row] = await this.orm.db
      .insert(listasDePrecios)
      .values({
        empresaId: input.empresaId,
        nombre: input.nombre,
        descripcion: input.descripcion ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create lista de precios", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof listasDePrecios.$inferSelect): ListaDePrecios {
    return {
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      descripcion: row.descripcion,
      activa: row.activa,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
