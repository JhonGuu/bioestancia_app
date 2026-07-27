import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateEmpresaInput,
  EmpresaRepository,
} from "@/modules/empresas/domain/empresa.repository";
import { Empresa, Rubro } from "@/modules/empresas/domain/empresa";
import { empresas } from "@/modules/empresas/infra/database/schema";

@injectable()
export class EmpresaRepositoryDrizzle implements EmpresaRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  async getById(id: string): Promise<Empresa | null> {
    const [row] = await this.orm.db
      .select()
      .from(empresas)
      .where(and(eq(empresas.id, id), isNull(empresas.deletedAt)));
    return row ? this.toDomain(row) : null;
  }

  async list(): Promise<Empresa[]> {
    const rows = await this.orm.db
      .select()
      .from(empresas)
      .where(and(eq(empresas.activa, true), isNull(empresas.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateEmpresaInput): Promise<Empresa> {
    const [row] = await this.orm.db
      .insert(empresas)
      .values({
        razonSocial: input.razonSocial,
        cuit: input.cuit ?? null,
        rubro: input.rubro,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create empresa", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof empresas.$inferSelect): Empresa {
    return {
      id: row.id,
      razonSocial: row.razonSocial,
      cuit: row.cuit,
      rubro: row.rubro as Rubro,
      activa: row.activa,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
