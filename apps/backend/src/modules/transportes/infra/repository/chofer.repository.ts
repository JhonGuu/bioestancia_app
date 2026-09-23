import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Chofer } from "@/modules/transportes/domain/chofer";
import {
  ChoferRepository,
  CreateChoferInput,
  UpdateChoferInput,
} from "@/modules/transportes/domain/chofer.repository";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { choferes } from "@/modules/transportes/infra/database/schema";

@injectable()
export class ChoferRepositoryDrizzle implements ChoferRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Chofer | null> {
    const [row] = await this.orm.db
      .select()
      .from(choferes)
      .where(and(eq(choferes.id, id), eq(choferes.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async findByIds(ids: string[], empresaId: string): Promise<Chofer[]> {
    if (ids.length === 0) return [];
    const rows = await this.orm.db
      .select()
      .from(choferes)
      .where(and(eq(choferes.empresaId, empresaId), inArray(choferes.id, ids)));
    return rows.map((row) => this.toDomain(row));
  }

  async findByCuit(empresaId: string, cuit: string): Promise<Chofer | null> {
    const [row] = await this.orm.db
      .select()
      .from(choferes)
      .where(and(eq(choferes.empresaId, empresaId), eq(choferes.cuit, cuit)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, estado: EstadoTransporteFiltro = "activos"): Promise<Chofer[]> {
    const filtroEstado =
      estado === "activos"
        ? isNull(choferes.deletedAt)
        : estado === "inactivos"
          ? isNotNull(choferes.deletedAt)
          : undefined;
    const rows = await this.orm.db
      .select()
      .from(choferes)
      .where(
        filtroEstado
          ? and(eq(choferes.empresaId, empresaId), filtroEstado)
          : eq(choferes.empresaId, empresaId),
      )
      .orderBy(choferes.apellido, choferes.nombre);
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateChoferInput): Promise<Chofer> {
    const [row] = await this.orm.db
      .insert(choferes)
      .values({
        empresaId: input.empresaId,
        transportistaId: input.transportistaId ?? null,
        nombre: input.nombre,
        apellido: input.apellido,
        cuit: input.cuit,
        dni: input.dni ?? null,
        telefono: input.telefono ?? null,
        licenciaVencimiento: input.licenciaVencimiento ?? null,
      })
      .returning();
    if (!row) throw new ApiError("Failed to create chofer", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateChoferInput): Promise<Chofer> {
    const [row] = await this.orm.db
      .update(choferes)
      .set({
        transportistaId: input.transportistaId ?? null,
        nombre: input.nombre,
        apellido: input.apellido,
        cuit: input.cuit,
        dni: input.dni ?? null,
        telefono: input.telefono ?? null,
        licenciaVencimiento: input.licenciaVencimiento ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(choferes.id, id), eq(choferes.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Chofer no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(choferes)
      .set({ deletedAt: new Date(), activo: false, updatedAt: new Date() })
      .where(and(eq(choferes.id, id), eq(choferes.empresaId, empresaId), isNull(choferes.deletedAt)))
      .returning();
    if (!row) throw new ApiError("Chofer no encontrado", Code.NOT_FOUND);
  }

  async reactivar(id: string, empresaId: string): Promise<Chofer> {
    const [row] = await this.orm.db
      .update(choferes)
      .set({ deletedAt: null, activo: true, updatedAt: new Date() })
      .where(and(eq(choferes.id, id), eq(choferes.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Chofer no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  private toDomain(row: typeof choferes.$inferSelect): Chofer {
    return {
      id: row.id,
      empresaId: row.empresaId,
      transportistaId: row.transportistaId,
      nombre: row.nombre,
      apellido: row.apellido,
      cuit: row.cuit,
      dni: row.dni,
      telefono: row.telefono,
      licenciaVencimiento: row.licenciaVencimiento,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
