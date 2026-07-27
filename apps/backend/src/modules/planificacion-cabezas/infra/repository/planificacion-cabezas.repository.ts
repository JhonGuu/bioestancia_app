import { and, between, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import {
  ListPlanificacionCabezasFilter,
  PlanificacionCabezasRepository,
  UpsertPlanificacionCabezasInput,
} from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.repository";
import { PlanificacionCabezas } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas";
import { planificacionCabezas } from "@/modules/planificacion-cabezas/infra/database/schema";

@injectable()
export class PlanificacionCabezasRepositoryDrizzle implements PlanificacionCabezasRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async listByRango(input: ListPlanificacionCabezasFilter): Promise<PlanificacionCabezas[]> {
    const rows = await this.orm.db
      .select()
      .from(planificacionCabezas)
      .where(
        and(
          eq(planificacionCabezas.empresaId, input.empresaId),
          between(planificacionCabezas.fecha, input.desde, input.hasta),
          input.clienteId ? eq(planificacionCabezas.clienteId, input.clienteId) : undefined,
          isNull(planificacionCabezas.deletedAt),
        ),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async upsertMany(input: UpsertPlanificacionCabezasInput[]): Promise<PlanificacionCabezas[]> {
    const resultados: PlanificacionCabezas[] = [];
    // Upsert uno por uno (no en batch): cada línea es un conflicto potencial
    // distinto por (clienteId, fecha), y son pocas filas por request (los
    // días de una semana, como mucho).
    for (const linea of input) {
      const [row] = await this.orm.db
        .insert(planificacionCabezas)
        .values({
          empresaId: linea.empresaId,
          clienteId: linea.clienteId,
          fecha: linea.fecha,
          cabezasPlanificadas: linea.cabezasPlanificadas,
          comentarios: linea.comentarios ?? null,
        })
        .onConflictDoUpdate({
          target: [planificacionCabezas.clienteId, planificacionCabezas.fecha],
          set: {
            cabezasPlanificadas: linea.cabezasPlanificadas,
            comentarios: linea.comentarios ?? null,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (row) {
        resultados.push(this.toDomain(row));
      }
    }
    return resultados;
  }

  private toDomain(row: typeof planificacionCabezas.$inferSelect): PlanificacionCabezas {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId,
      fecha: row.fecha,
      cabezasPlanificadas: row.cabezasPlanificadas,
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
