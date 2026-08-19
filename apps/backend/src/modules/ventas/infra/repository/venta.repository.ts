import { and, between, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  VentaRepository,
  CreateVentaInput,
  SetPrecioInput,
  UpdateVentaItemInput,
} from "@/modules/ventas/domain/venta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
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

  async listByBoleta(boletaId: string, empresaId: string): Promise<Venta[]> {
    const rows = await this.orm.db
      .select()
      .from(ventas)
      .where(
        and(eq(ventas.boletaId, boletaId), eq(ventas.empresaId, empresaId), isNull(ventas.deletedAt)),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async listByCliente(clienteId: string, empresaId: string): Promise<Venta[]> {
    const rows = await this.orm.db
      .select()
      .from(ventas)
      .where(
        and(eq(ventas.clienteId, clienteId), eq(ventas.empresaId, empresaId), isNull(ventas.deletedAt)),
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

  async listByEmpresaYRango(empresaId: string, desde: Date, hasta: Date): Promise<Venta[]> {
    const rows = await this.orm.db
      .select()
      .from(ventas)
      .where(
        and(
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
        categoria: input.categoria ?? null,
        kg: String(input.kg),
        precioKg: input.precioKg !== undefined ? String(input.precioKg) : null,
        total: input.total !== undefined ? String(input.total) : null,
        fecha: input.fecha,
        clienteFinalId: input.clienteFinalId ?? null,
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create venta", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async setPrecio(id: string, empresaId: string, input: SetPrecioInput): Promise<Venta> {
    const [row] = await this.orm.db
      .update(ventas)
      .set({
        precioKg: String(input.precioKg),
        total: String(input.total),
        updatedAt: new Date(),
      })
      .where(and(eq(ventas.id, id), eq(ventas.empresaId, empresaId), isNull(ventas.deletedAt)))
      .returning();
    if (!row) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateVentaItemInput): Promise<Venta> {
    const [row] = await this.orm.db
      .update(ventas)
      .set({
        ...(input.garron !== undefined ? { garron: input.garron } : {}),
        ...(input.kg !== undefined ? { kg: String(input.kg) } : {}),
        ...(input.categoria !== undefined ? { categoria: input.categoria } : {}),
        ...(input.comentarios !== undefined ? { comentarios: input.comentarios } : {}),
        ...(input.total !== undefined ? { total: input.total !== null ? String(input.total) : null } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(ventas.id, id), eq(ventas.empresaId, empresaId), isNull(ventas.deletedAt)))
      .returning();
    if (!row) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(ventas)
      .set({ activo: false, deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(ventas.id, id), eq(ventas.empresaId, empresaId), isNull(ventas.deletedAt)))
      .returning({ id: ventas.id });
    if (!row) {
      throw new ApiError("Venta no encontrada", Code.NOT_FOUND);
    }
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
      categoria: row.categoria as CategoriaVenta | null,
      kg: Number(row.kg),
      precioKg: row.precioKg !== null ? Number(row.precioKg) : null,
      total: row.total !== null ? Number(row.total) : null,
      fecha: row.fecha,
      clienteFinalId: row.clienteFinalId,
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
