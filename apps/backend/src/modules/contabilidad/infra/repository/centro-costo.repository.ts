import { and, count, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CentroCosto } from "@/modules/contabilidad/domain/centro-costo";
import {
  CentroCostoRepository,
  CreateCentroCostoInput,
  UpdateCentroCostoInput,
} from "@/modules/contabilidad/domain/centro-costo.repository";
import { asientoLineas, centrosCosto } from "@/modules/contabilidad/infra/database/schema";

@injectable()
export class CentroCostoRepositoryDrizzle implements CentroCostoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async list(empresaId: string, incluirInactivos = true): Promise<CentroCosto[]> {
    const condiciones = [eq(centrosCosto.empresaId, empresaId)];
    if (!incluirInactivos) condiciones.push(eq(centrosCosto.activo, true));

    const rows = await this.orm.db
      .select()
      .from(centrosCosto)
      .where(and(...condiciones))
      .orderBy(centrosCosto.codigo);
    return rows.map((row) => this.toDomain(row));
  }

  async getById(id: string, empresaId: string): Promise<CentroCosto | null> {
    const [row] = await this.orm.db
      .select()
      .from(centrosCosto)
      .where(and(eq(centrosCosto.id, id), eq(centrosCosto.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async getByCodigo(codigo: string, empresaId: string): Promise<CentroCosto | null> {
    const [row] = await this.orm.db
      .select()
      .from(centrosCosto)
      .where(and(eq(centrosCosto.codigo, codigo), eq(centrosCosto.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateCentroCostoInput): Promise<CentroCosto> {
    const [row] = await this.orm.db
      .insert(centrosCosto)
      .values({ empresaId: input.empresaId, codigo: input.codigo, nombre: input.nombre })
      .returning();
    if (!row) throw new ApiError("No se pudo crear el centro de costo", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateCentroCostoInput): Promise<CentroCosto> {
    const [row] = await this.orm.db
      .update(centrosCosto)
      .set({
        ...(input.codigo !== undefined && { codigo: input.codigo }),
        ...(input.nombre !== undefined && { nombre: input.nombre }),
        ...(input.activo !== undefined && { activo: input.activo }),
        updatedAt: new Date(),
      })
      .where(and(eq(centrosCosto.id, id), eq(centrosCosto.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("El centro de costo no existe", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async tieneMovimientos(id: string): Promise<boolean> {
    const [row] = await this.orm.db
      .select({ total: count() })
      .from(asientoLineas)
      .where(eq(asientoLineas.centroCostoId, id));
    return (row?.total ?? 0) > 0;
  }

  async delete(id: string, empresaId: string): Promise<void> {
    await this.orm.db
      .delete(centrosCosto)
      .where(and(eq(centrosCosto.id, id), eq(centrosCosto.empresaId, empresaId)));
  }

  private toDomain(row: typeof centrosCosto.$inferSelect): CentroCosto {
    return {
      id: row.id,
      empresaId: row.empresaId,
      codigo: row.codigo,
      nombre: row.nombre,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
