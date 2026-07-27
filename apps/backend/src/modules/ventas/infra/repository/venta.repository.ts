import { and, between, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { VentaRepository, CreateVentaInput } from "@/modules/ventas/domain/venta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { ventas } from "@/modules/ventas/infra/database/schema";

@injectable()
export class VentaRepositoryDrizzle implements VentaRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Venta | null> {
    const [row] = await this.orm.db
      .select()
      .from(ventas)
      .where(and(eq(ventas.id, id), eq(ventas.empresaId, empresaId), isNull(ventas.deletedAt)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<Venta[]> {
    const rows = await this.orm.db
      .select()
      .from(ventas)
      .where(and(eq(ventas.empresaId, empresaId), isNull(ventas.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async listByCompra(compraId: string, empresaId: string): Promise<Venta[]> {
    const rows = await this.orm.db
      .select()
      .from(ventas)
      .where(
        and(
          eq(ventas.compraId, compraId),
          eq(ventas.empresaId, empresaId),
          isNull(ventas.deletedAt),
        ),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async listByClienteYRango(
    clienteId: string,
    empresaId: string,
    desde: Date,
    hasta: Date,
  ): Promise<Venta[]> {
    const rows = await this.orm.db
      .select()
      .from(ventas)
      .where(
        and(
          eq(ventas.clienteId, clienteId),
          eq(ventas.empresaId, empresaId),
          between(ventas.fecha, desde, hasta),
          isNull(ventas.deletedAt),
        ),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateVentaInput): Promise<Venta> {
    const [row] = await this.orm.db
      .insert(ventas)
      .values({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        boletaId: input.boletaId ?? null,
        compraId: input.compraId ?? null,
        garron: input.garron ?? null,
        formaVenta: input.formaVenta,
        kg: String(input.kg),
        precioKg: String(input.precioKg),
        total: String(input.total),
        fecha: input.fecha,
        clienteFinalReferencia: input.clienteFinalReferencia ?? null,
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create venta", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof ventas.$inferSelect): Venta {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId,
      boletaId: row.boletaId,
      compraId: row.compraId,
      garron: row.garron,
      formaVenta: row.formaVenta as FormaVenta,
      kg: Number(row.kg),
      precioKg: Number(row.precioKg),
      total: Number(row.total),
      fecha: row.fecha,
      clienteFinalReferencia: row.clienteFinalReferencia,
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
