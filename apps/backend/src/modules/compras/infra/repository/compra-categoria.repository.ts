import { asc, eq, inArray } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  ActualizarFaenaCompraCategoriaData,
  ActualizarLiquidacionCompraCategoriaData,
  CompraCategoriaRepository,
  CreateCompraCategoriaInput,
  SyncCompraCategoriaLine,
} from "@/modules/compras/domain/compra-categoria.repository";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { RazaPorcino } from "@/modules/compras/domain/raza-porcino";
import { compraCategorias } from "@/modules/compras/infra/database/schema";

@injectable()
export class CompraCategoriaRepositoryDrizzle implements CompraCategoriaRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async listByCompra(compraId: string): Promise<CompraCategoria[]> {
    const rows = await this.orm.db
      .select()
      .from(compraCategorias)
      .where(eq(compraCategorias.compraId, compraId))
      .orderBy(asc(compraCategorias.createdAt));
    return rows.map((row) => this.toDomain(row));
  }

  async getById(id: string): Promise<CompraCategoria | null> {
    const [row] = await this.orm.db.select().from(compraCategorias).where(eq(compraCategorias.id, id));
    return row ? this.toDomain(row) : null;
  }

  async createMany(input: CreateCompraCategoriaInput[]): Promise<CompraCategoria[]> {
    const rows = await this.orm.db
      .insert(compraCategorias)
      .values(
        input.map((line) => ({
          compraId: line.compraId,
          categoria: line.categoria,
          raza: line.raza ?? null,
          cabezas: line.cabezas,
        })),
      )
      .returning();
    return rows.map((row) => this.toDomain(row));
  }

  async syncForCompra(compraId: string, lines: SyncCompraCategoriaLine[]): Promise<CompraCategoria[]> {
    const existentes = await this.listByCompra(compraId);
    const existentesIds = new Set(existentes.map((e) => e.id));
    const idsAConservar = new Set(lines.filter((l) => l.id).map((l) => l.id as string));
    const idsABorrar = existentes.filter((e) => !idsAConservar.has(e.id)).map((e) => e.id);

    if (idsABorrar.length > 0) {
      await this.orm.db.delete(compraCategorias).where(inArray(compraCategorias.id, idsABorrar));
    }

    const resultado: CompraCategoria[] = [];
    for (const linea of lines) {
      if (linea.id && existentesIds.has(linea.id)) {
        const [row] = await this.orm.db
          .update(compraCategorias)
          .set({
            categoria: linea.categoria,
            raza: linea.raza ?? null,
            cabezas: linea.cabezas,
            updatedAt: new Date(),
          })
          .where(eq(compraCategorias.id, linea.id))
          .returning();
        if (row) resultado.push(this.toDomain(row));
      } else {
        const [row] = await this.orm.db
          .insert(compraCategorias)
          .values({
            compraId,
            categoria: linea.categoria,
            raza: linea.raza ?? null,
            cabezas: linea.cabezas,
          })
          .returning();
        if (row) resultado.push(this.toDomain(row));
      }
    }
    return resultado;
  }

  async actualizarFaena(
    id: string,
    input: ActualizarFaenaCompraCategoriaData,
  ): Promise<CompraCategoria> {
    const [row] = await this.orm.db
      .update(compraCategorias)
      .set({
        kgVivoFaena: String(input.kgVivoFaena),
        kgCarne: String(input.kgCarne),
        porcentajeMagro: input.porcentajeMagro !== null ? String(input.porcentajeMagro) : null,
        destinoComercial: input.destinoComercial,
        cuartosDelantero: input.cuartosDelantero,
        cuartosTrasero: input.cuartosTrasero,
        updatedAt: new Date(),
      })
      .where(eq(compraCategorias.id, id))
      .returning();
    if (!row) {
      throw new ApiError("Línea de categoría de compra no encontrada", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  async actualizarLiquidacion(
    id: string,
    input: ActualizarLiquidacionCompraCategoriaData,
  ): Promise<CompraCategoria> {
    const [row] = await this.orm.db
      .update(compraCategorias)
      .set({
        precioKg: String(input.precioKg),
        importeBruto: String(input.importeBruto),
        porcentajeIva: String(input.porcentajeIva),
        importeIva: String(input.importeIva),
        updatedAt: new Date(),
      })
      .where(eq(compraCategorias.id, id))
      .returning();
    if (!row) {
      throw new ApiError("Línea de categoría de compra no encontrada", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof compraCategorias.$inferSelect): CompraCategoria {
    return {
      id: row.id,
      compraId: row.compraId,
      categoria: row.categoria as CategoriaPorcino,
      raza: row.raza as RazaPorcino | null,
      cabezas: row.cabezas,
      pesoBruto: row.pesoBruto !== null ? Number(row.pesoBruto) : null,
      pesoNeto: row.pesoNeto !== null ? Number(row.pesoNeto) : null,
      kgVivoFaena: row.kgVivoFaena !== null ? Number(row.kgVivoFaena) : null,
      kgCarne: row.kgCarne !== null ? Number(row.kgCarne) : null,
      porcentajeMagro: row.porcentajeMagro !== null ? Number(row.porcentajeMagro) : null,
      destinoComercial: row.destinoComercial,
      cuartosDelantero: row.cuartosDelantero,
      cuartosTrasero: row.cuartosTrasero,
      precioKg: row.precioKg !== null ? Number(row.precioKg) : null,
      importeBruto: row.importeBruto !== null ? Number(row.importeBruto) : null,
      porcentajeIva: row.porcentajeIva !== null ? Number(row.porcentajeIva) : null,
      importeIva: row.importeIva !== null ? Number(row.importeIva) : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
