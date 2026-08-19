import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CargoRepository,
  CreateCargoInput,
  EstadoCargoFiltro,
  UpdateCargoInput,
} from "@/modules/personal/domain/cargo.repository";
import { Cargo } from "@/modules/personal/domain/cargo";
import { cargos } from "@/modules/personal/infra/database/schema";

@injectable()
export class CargoRepositoryDrizzle implements CargoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Cargo | null> {
    const [row] = await this.orm.db
      .select()
      .from(cargos)
      .where(and(eq(cargos.id, id), eq(cargos.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, estado: EstadoCargoFiltro = "activos"): Promise<Cargo[]> {
    const filtroEstado =
      estado === "activos"
        ? isNull(cargos.deletedAt)
        : estado === "inactivos"
          ? isNotNull(cargos.deletedAt)
          : undefined;
    const rows = await this.orm.db
      .select()
      .from(cargos)
      .where(filtroEstado ? and(eq(cargos.empresaId, empresaId), filtroEstado) : eq(cargos.empresaId, empresaId));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateCargoInput): Promise<Cargo> {
    const [row] = await this.orm.db
      .insert(cargos)
      .values({
        empresaId: input.empresaId,
        nombre: input.nombre,
        toleranciaMinutos: input.toleranciaMinutos ?? null,
      })
      .returning();
    if (!row) throw new ApiError("Failed to create cargo", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateCargoInput): Promise<Cargo> {
    const [row] = await this.orm.db
      .update(cargos)
      .set({
        nombre: input.nombre,
        toleranciaMinutos: input.toleranciaMinutos ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(cargos.id, id), eq(cargos.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Cargo no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(cargos)
      .set({ deletedAt: new Date(), activo: false, updatedAt: new Date() })
      .where(and(eq(cargos.id, id), eq(cargos.empresaId, empresaId), isNull(cargos.deletedAt)))
      .returning();
    if (!row) throw new ApiError("Cargo no encontrado", Code.NOT_FOUND);
  }

  async reactivar(id: string, empresaId: string): Promise<Cargo> {
    const [row] = await this.orm.db
      .update(cargos)
      .set({ deletedAt: null, activo: true, updatedAt: new Date() })
      .where(and(eq(cargos.id, id), eq(cargos.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Cargo no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  private toDomain(row: typeof cargos.$inferSelect): Cargo {
    return {
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      toleranciaMinutos: row.toleranciaMinutos,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
