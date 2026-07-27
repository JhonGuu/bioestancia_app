import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CompraRepository,
  CreateCompraInput,
  CerrarCompraData,
} from "@/modules/compras/domain/compra.repository";
import { Compra } from "@/modules/compras/domain/compra";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { compras } from "@/modules/compras/infra/database/schema";

@injectable()
export class CompraRepositoryDrizzle implements CompraRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Compra | null> {
    const [row] = await this.orm.db
      .select()
      .from(compras)
      .where(and(eq(compras.id, id), eq(compras.empresaId, empresaId), isNull(compras.deletedAt)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<Compra[]> {
    const rows = await this.orm.db
      .select()
      .from(compras)
      .where(and(eq(compras.empresaId, empresaId), isNull(compras.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateCompraInput): Promise<Compra> {
    const [row] = await this.orm.db
      .insert(compras)
      .values({
        empresaId: input.empresaId,
        proveedorId: input.proveedorId,
        numero: input.numero,
        especie: input.especie,
        letra: input.letra ?? null,
        fecha: input.fecha,
        dte: input.dte,
        remito: input.remito,
        porcentajeDesbaste: String(input.porcentajeDesbaste),
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create compra", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async cerrar(id: string, empresaId: string, input: CerrarCompraData): Promise<Compra> {
    const [row] = await this.orm.db
      .update(compras)
      .set({
        cerrada: true,
        fechaCierre: input.fechaCierre,
        pesoFinalVenta: String(input.pesoFinalVenta),
        rinde: String(input.rinde),
        updatedAt: new Date(),
      })
      .where(and(eq(compras.id, id), eq(compras.empresaId, empresaId), isNull(compras.deletedAt)))
      .returning();
    if (!row) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof compras.$inferSelect): Compra {
    return {
      id: row.id,
      empresaId: row.empresaId,
      proveedorId: row.proveedorId,
      numero: row.numero,
      especie: row.especie as EspecieAnimal,
      letra: row.letra,
      fecha: row.fecha,
      dte: row.dte,
      remito: row.remito,
      porcentajeDesbaste: Number(row.porcentajeDesbaste),
      cerrada: row.cerrada,
      fechaCierre: row.fechaCierre,
      pesoFinalVenta: row.pesoFinalVenta !== null ? Number(row.pesoFinalVenta) : null,
      rinde: row.rinde !== null ? Number(row.rinde) : null,
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
