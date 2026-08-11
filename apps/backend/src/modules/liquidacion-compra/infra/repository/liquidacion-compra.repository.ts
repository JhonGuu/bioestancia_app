import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateLiquidacionCompraInput,
  LiquidacionCompraRepository,
  UpdateCaeInput,
} from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { LiquidacionCompra } from "@/modules/liquidacion-compra/domain/liquidacion-compra";
import { liquidacionCompra } from "@/modules/liquidacion-compra/infra/database/schema";

@injectable()
export class LiquidacionCompraRepositoryDrizzle implements LiquidacionCompraRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<LiquidacionCompra | null> {
    const [row] = await this.orm.db
      .select()
      .from(liquidacionCompra)
      .where(
        and(
          eq(liquidacionCompra.id, id),
          eq(liquidacionCompra.empresaId, empresaId),
          isNull(liquidacionCompra.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async getByCompraId(compraId: string, empresaId: string): Promise<LiquidacionCompra | null> {
    const [row] = await this.orm.db
      .select()
      .from(liquidacionCompra)
      .where(
        and(
          eq(liquidacionCompra.compraId, compraId),
          eq(liquidacionCompra.empresaId, empresaId),
          isNull(liquidacionCompra.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateLiquidacionCompraInput): Promise<LiquidacionCompra> {
    const [row] = await this.orm.db
      .insert(liquidacionCompra)
      .values({
        empresaId: input.empresaId,
        compraId: input.compraId,
        numeroComprobante: input.numeroComprobante,
        fecha: input.fecha,
        fechaOperacion: input.fechaOperacion ?? null,
        cae: input.cae ?? null,
        fechaVencimientoCae: input.fechaVencimientoCae ?? null,
        importeBruto: String(input.importeBruto),
        ivaSobreBruto: String(input.ivaSobreBruto),
        totalGastos: input.totalGastos !== undefined ? String(input.totalGastos) : null,
        ivaSobreGastos: input.ivaSobreGastos !== undefined ? String(input.ivaSobreGastos) : null,
        totalTributos: input.totalTributos !== undefined ? String(input.totalTributos) : null,
        importeNeto: String(input.importeNeto),
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create liquidación de compra", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async updateCae(id: string, empresaId: string, input: UpdateCaeInput): Promise<LiquidacionCompra> {
    const [row] = await this.orm.db
      .update(liquidacionCompra)
      .set({
        numeroComprobante: input.numeroComprobante,
        cae: input.cae,
        fechaVencimientoCae: input.fechaVencimientoCae,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(liquidacionCompra.id, id),
          eq(liquidacionCompra.empresaId, empresaId),
          isNull(liquidacionCompra.deletedAt),
        ),
      )
      .returning();
    if (!row) {
      throw new ApiError("Liquidación de compra no encontrada", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof liquidacionCompra.$inferSelect): LiquidacionCompra {
    return {
      id: row.id,
      compraId: row.compraId,
      numeroComprobante: row.numeroComprobante,
      fecha: row.fecha,
      fechaOperacion: row.fechaOperacion,
      cae: row.cae,
      fechaVencimientoCae: row.fechaVencimientoCae,
      importeBruto: Number(row.importeBruto),
      ivaSobreBruto: Number(row.ivaSobreBruto),
      totalGastos: row.totalGastos !== null ? Number(row.totalGastos) : null,
      ivaSobreGastos: row.ivaSobreGastos !== null ? Number(row.ivaSobreGastos) : null,
      totalTributos: row.totalTributos !== null ? Number(row.totalTributos) : null,
      importeNeto: Number(row.importeNeto),
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
