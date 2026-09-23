import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { TipoVehiculo, Vehiculo } from "@/modules/transportes/domain/vehiculo";
import {
  CreateVehiculoInput,
  UpdateVehiculoInput,
  VehiculoRepository,
} from "@/modules/transportes/domain/vehiculo.repository";
import { vehiculos } from "@/modules/transportes/infra/database/schema";

@injectable()
export class VehiculoRepositoryDrizzle implements VehiculoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Vehiculo | null> {
    const [row] = await this.orm.db
      .select()
      .from(vehiculos)
      .where(and(eq(vehiculos.id, id), eq(vehiculos.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async findByIds(ids: string[], empresaId: string): Promise<Vehiculo[]> {
    if (ids.length === 0) return [];
    const rows = await this.orm.db
      .select()
      .from(vehiculos)
      .where(and(eq(vehiculos.empresaId, empresaId), inArray(vehiculos.id, ids)));
    return rows.map((row) => this.toDomain(row));
  }

  async findByPatente(empresaId: string, patente: string): Promise<Vehiculo | null> {
    const [row] = await this.orm.db
      .select()
      .from(vehiculos)
      .where(and(eq(vehiculos.empresaId, empresaId), eq(vehiculos.patente, patente)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, estado: EstadoTransporteFiltro = "activos"): Promise<Vehiculo[]> {
    const filtroEstado =
      estado === "activos"
        ? isNull(vehiculos.deletedAt)
        : estado === "inactivos"
          ? isNotNull(vehiculos.deletedAt)
          : undefined;
    const rows = await this.orm.db
      .select()
      .from(vehiculos)
      .where(
        filtroEstado
          ? and(eq(vehiculos.empresaId, empresaId), filtroEstado)
          : eq(vehiculos.empresaId, empresaId),
      )
      .orderBy(vehiculos.patente);
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateVehiculoInput): Promise<Vehiculo> {
    const [row] = await this.orm.db
      .insert(vehiculos)
      .values({
        empresaId: input.empresaId,
        transportistaId: input.transportistaId ?? null,
        tipo: input.tipo,
        patente: input.patente,
        descripcion: input.descripcion ?? null,
        rtoVencimiento: input.rtoVencimiento ?? null,
        seguroVencimiento: input.seguroVencimiento ?? null,
        habilitacionAnimalesVencimiento: input.habilitacionAnimalesVencimiento ?? null,
      })
      .returning();
    if (!row) throw new ApiError("Failed to create vehiculo", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateVehiculoInput): Promise<Vehiculo> {
    const [row] = await this.orm.db
      .update(vehiculos)
      .set({
        transportistaId: input.transportistaId ?? null,
        tipo: input.tipo,
        patente: input.patente,
        descripcion: input.descripcion ?? null,
        rtoVencimiento: input.rtoVencimiento ?? null,
        seguroVencimiento: input.seguroVencimiento ?? null,
        habilitacionAnimalesVencimiento: input.habilitacionAnimalesVencimiento ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(vehiculos.id, id), eq(vehiculos.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Vehículo no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(vehiculos)
      .set({ deletedAt: new Date(), activo: false, updatedAt: new Date() })
      .where(and(eq(vehiculos.id, id), eq(vehiculos.empresaId, empresaId), isNull(vehiculos.deletedAt)))
      .returning();
    if (!row) throw new ApiError("Vehículo no encontrado", Code.NOT_FOUND);
  }

  async reactivar(id: string, empresaId: string): Promise<Vehiculo> {
    const [row] = await this.orm.db
      .update(vehiculos)
      .set({ deletedAt: null, activo: true, updatedAt: new Date() })
      .where(and(eq(vehiculos.id, id), eq(vehiculos.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Vehículo no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  private toDomain(row: typeof vehiculos.$inferSelect): Vehiculo {
    return {
      id: row.id,
      empresaId: row.empresaId,
      transportistaId: row.transportistaId,
      tipo: row.tipo as TipoVehiculo,
      patente: row.patente,
      descripcion: row.descripcion,
      rtoVencimiento: row.rtoVencimiento,
      seguroVencimiento: row.seguroVencimiento,
      habilitacionAnimalesVencimiento: row.habilitacionAnimalesVencimiento,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
