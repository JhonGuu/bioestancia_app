import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateFrigorificoInput,
  EstadoFrigorificoFiltro,
  FrigorificoRepository,
  UpdateFrigorificoInput,
} from "@/modules/frigorificos/domain/frigorifico.repository";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import { frigorificos } from "@/modules/frigorificos/infra/database/schema";

@injectable()
export class FrigorificoRepositoryDrizzle implements FrigorificoRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  /**
   * A diferencia de `list()`, NO filtra `isNull(deletedAt)` — un frigorífico
   * inactivo tiene que poder seguir resolviéndose por id (resultados de
   * faena históricos que lo referencian no dejan de encontrarlo).
   */
  async getById(id: string, empresaId: string): Promise<Frigorifico | null> {
    const [row] = await this.orm.db
      .select()
      .from(frigorificos)
      .where(and(eq(frigorificos.id, id), eq(frigorificos.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, estado: EstadoFrigorificoFiltro = "activos"): Promise<Frigorifico[]> {
    const filtroEstado =
      estado === "activos"
        ? isNull(frigorificos.deletedAt)
        : estado === "inactivos"
          ? isNotNull(frigorificos.deletedAt)
          : undefined;
    const rows = await this.orm.db
      .select()
      .from(frigorificos)
      .where(
        filtroEstado
          ? and(eq(frigorificos.empresaId, empresaId), filtroEstado)
          : eq(frigorificos.empresaId, empresaId),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateFrigorificoInput): Promise<Frigorifico> {
    const [row] = await this.orm.db
      .insert(frigorificos)
      .values({
        empresaId: input.empresaId,
        nombre: input.nombre,
        cuit: input.cuit ?? null,
        senasaNumero: input.senasaNumero ?? null,
        rucaNumero: input.rucaNumero ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create frigorifico", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateFrigorificoInput): Promise<Frigorifico> {
    const [row] = await this.orm.db
      .update(frigorificos)
      .set({
        nombre: input.nombre,
        cuit: input.cuit ?? null,
        senasaNumero: input.senasaNumero ?? null,
        rucaNumero: input.rucaNumero ?? null,
        updatedAt: new Date(),
      })
      // Sin filtrar `isNull(deletedAt)` — se puede editar un frigorífico
      // inactivo sin que la edición en sí lo reactive.
      .where(and(eq(frigorificos.id, id), eq(frigorificos.empresaId, empresaId)))
      .returning();
    if (!row) {
      throw new ApiError("Frigorífico no encontrado", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(frigorificos)
      .set({ deletedAt: new Date(), activo: false, updatedAt: new Date() })
      .where(
        and(
          eq(frigorificos.id, id),
          eq(frigorificos.empresaId, empresaId),
          isNull(frigorificos.deletedAt),
        ),
      )
      .returning();
    if (!row) {
      throw new ApiError("Frigorífico no encontrado", Code.NOT_FOUND);
    }
  }

  async reactivar(id: string, empresaId: string): Promise<Frigorifico> {
    const [row] = await this.orm.db
      .update(frigorificos)
      .set({ deletedAt: null, activo: true, updatedAt: new Date() })
      .where(and(eq(frigorificos.id, id), eq(frigorificos.empresaId, empresaId)))
      .returning();
    if (!row) {
      throw new ApiError("Frigorífico no encontrado", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof frigorificos.$inferSelect): Frigorifico {
    return {
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      cuit: row.cuit,
      senasaNumero: row.senasaNumero,
      rucaNumero: row.rucaNumero,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
