import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  GrupoTropasRepository,
  CreateGrupoTropasInput,
  CerrarGrupoTropasData,
} from "@/modules/grupos-tropas/domain/grupo-tropas.repository";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";
import { gruposTropas } from "@/modules/grupos-tropas/infra/database/schema";

@injectable()
export class GrupoTropasRepositoryDrizzle implements GrupoTropasRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<GrupoTropas | null> {
    const [row] = await this.orm.db
      .select()
      .from(gruposTropas)
      .where(and(eq(gruposTropas.id, id), eq(gruposTropas.empresaId, empresaId), isNull(gruposTropas.deletedAt)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<GrupoTropas[]> {
    const rows = await this.orm.db
      .select()
      .from(gruposTropas)
      .where(and(eq(gruposTropas.empresaId, empresaId), isNull(gruposTropas.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateGrupoTropasInput): Promise<GrupoTropas> {
    const [row] = await this.orm.db
      .insert(gruposTropas)
      .values({
        empresaId: input.empresaId,
        nombre: input.nombre ?? null,
        pesoBrutoTotal: String(input.pesoBrutoTotal),
        pesoNetoTotal: String(input.pesoNetoTotal),
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create grupo de tropas", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async cerrar(id: string, empresaId: string, input: CerrarGrupoTropasData): Promise<GrupoTropas> {
    const [row] = await this.orm.db
      .update(gruposTropas)
      .set({
        cerrado: true,
        fechaCierre: input.fechaCierre,
        pesoFinalVentaTotal: String(input.pesoFinalVentaTotal),
        rinde: String(input.rinde),
        alertaSuperavit: input.alertaSuperavit,
        updatedAt: new Date(),
      })
      .where(and(eq(gruposTropas.id, id), eq(gruposTropas.empresaId, empresaId), isNull(gruposTropas.deletedAt)))
      .returning();
    if (!row) {
      throw new ApiError("Grupo de tropas no encontrado", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  async reabrir(id: string, empresaId: string): Promise<GrupoTropas> {
    const [row] = await this.orm.db
      .update(gruposTropas)
      .set({
        cerrado: false,
        fechaCierre: null,
        pesoFinalVentaTotal: null,
        rinde: null,
        alertaSuperavit: false,
        updatedAt: new Date(),
      })
      .where(and(eq(gruposTropas.id, id), eq(gruposTropas.empresaId, empresaId), isNull(gruposTropas.deletedAt)))
      .returning();
    if (!row) {
      throw new ApiError("Grupo de tropas no encontrado", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof gruposTropas.$inferSelect): GrupoTropas {
    return {
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      pesoBrutoTotal: Number(row.pesoBrutoTotal),
      pesoNetoTotal: Number(row.pesoNetoTotal),
      cerrado: row.cerrado,
      fechaCierre: row.fechaCierre,
      pesoFinalVentaTotal: row.pesoFinalVentaTotal !== null ? Number(row.pesoFinalVentaTotal) : null,
      rinde: row.rinde !== null ? Number(row.rinde) : null,
      alertaSuperavit: row.alertaSuperavit,
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
