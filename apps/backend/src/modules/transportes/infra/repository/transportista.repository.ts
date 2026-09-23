import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { Transportista } from "@/modules/transportes/domain/transportista";
import {
  CreateTransportistaInput,
  TransportistaRepository,
  UpdateTransportistaInput,
} from "@/modules/transportes/domain/transportista.repository";
import { transportistas } from "@/modules/transportes/infra/database/schema";

@injectable()
export class TransportistaRepositoryDrizzle implements TransportistaRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Transportista | null> {
    const [row] = await this.orm.db
      .select()
      .from(transportistas)
      .where(and(eq(transportistas.id, id), eq(transportistas.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async findByCuit(empresaId: string, cuit: string): Promise<Transportista | null> {
    const [row] = await this.orm.db
      .select()
      .from(transportistas)
      .where(and(eq(transportistas.empresaId, empresaId), eq(transportistas.cuit, cuit)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, estado: EstadoTransporteFiltro = "activos"): Promise<Transportista[]> {
    const filtroEstado =
      estado === "activos"
        ? isNull(transportistas.deletedAt)
        : estado === "inactivos"
          ? isNotNull(transportistas.deletedAt)
          : undefined;
    const rows = await this.orm.db
      .select()
      .from(transportistas)
      .where(
        filtroEstado
          ? and(eq(transportistas.empresaId, empresaId), filtroEstado)
          : eq(transportistas.empresaId, empresaId),
      )
      .orderBy(transportistas.nombre);
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateTransportistaInput): Promise<Transportista> {
    const [row] = await this.orm.db
      .insert(transportistas)
      .values({
        empresaId: input.empresaId,
        nombre: input.nombre,
        cuit: input.cuit,
        telefono: input.telefono ?? null,
        esPropio: input.esPropio ?? false,
      })
      .returning();
    if (!row) throw new ApiError("Failed to create transportista", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateTransportistaInput): Promise<Transportista> {
    const [row] = await this.orm.db
      .update(transportistas)
      .set({
        nombre: input.nombre,
        cuit: input.cuit,
        telefono: input.telefono ?? null,
        esPropio: input.esPropio ?? false,
        updatedAt: new Date(),
      })
      .where(and(eq(transportistas.id, id), eq(transportistas.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Transportista no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(transportistas)
      .set({ deletedAt: new Date(), activo: false, updatedAt: new Date() })
      .where(
        and(
          eq(transportistas.id, id),
          eq(transportistas.empresaId, empresaId),
          isNull(transportistas.deletedAt),
        ),
      )
      .returning();
    if (!row) throw new ApiError("Transportista no encontrado", Code.NOT_FOUND);
  }

  async reactivar(id: string, empresaId: string): Promise<Transportista> {
    const [row] = await this.orm.db
      .update(transportistas)
      .set({ deletedAt: null, activo: true, updatedAt: new Date() })
      .where(and(eq(transportistas.id, id), eq(transportistas.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Transportista no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  private toDomain(row: typeof transportistas.$inferSelect): Transportista {
    return {
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      cuit: row.cuit,
      telefono: row.telefono,
      esPropio: row.esPropio,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
