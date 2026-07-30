import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CompraRepository,
  CreateCompraInput,
  CerrarCompraData,
  UpdateCompraData,
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
        pesoBruto: String(input.pesoBruto),
        pesoNeto: String(input.pesoNeto),
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create compra", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateCompraData): Promise<Compra> {
    const [row] = await this.orm.db
      .update(compras)
      .set({
        ...(input.proveedorId !== undefined && { proveedorId: input.proveedorId }),
        ...(input.especie !== undefined && { especie: input.especie }),
        ...(input.numero !== undefined && { numero: input.numero }),
        ...(input.letra !== undefined && { letra: input.letra }),
        ...(input.fecha !== undefined && { fecha: input.fecha }),
        ...(input.dte !== undefined && { dte: input.dte }),
        ...(input.remito !== undefined && { remito: input.remito }),
        ...(input.porcentajeDesbaste !== undefined && {
          porcentajeDesbaste: String(input.porcentajeDesbaste),
        }),
        ...(input.pesoBruto !== undefined && { pesoBruto: String(input.pesoBruto) }),
        ...(input.pesoNeto !== undefined && { pesoNeto: String(input.pesoNeto) }),
        ...(input.comentarios !== undefined && { comentarios: input.comentarios }),
        updatedAt: new Date(),
      })
      .where(and(eq(compras.id, id), eq(compras.empresaId, empresaId), isNull(compras.deletedAt)))
      .returning();
    if (!row) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  async reabrir(id: string, empresaId: string): Promise<Compra> {
    const [row] = await this.orm.db
      .update(compras)
      .set({
        cerrada: false,
        fechaCierre: null,
        pesoFinalVenta: null,
        rinde: null,
        updatedAt: new Date(),
      })
      .where(and(eq(compras.id, id), eq(compras.empresaId, empresaId), isNull(compras.deletedAt)))
      .returning();
    if (!row) {
      throw new ApiError("Compra no encontrada", Code.NOT_FOUND);
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
      pesoBruto: Number(row.pesoBruto),
      pesoNeto: Number(row.pesoNeto),
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
