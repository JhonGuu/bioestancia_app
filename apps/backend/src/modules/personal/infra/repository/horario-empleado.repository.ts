import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import {
  HorarioEmpleadoRepository,
  SetHorarioInput,
} from "@/modules/personal/domain/horario-empleado.repository";
import { HorarioEmpleado } from "@/modules/personal/domain/horario-empleado";
import { horariosEmpleado } from "@/modules/personal/infra/database/schema";

@injectable()
export class HorarioEmpleadoRepositoryDrizzle implements HorarioEmpleadoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async listByEmpleado(empleadoId: string): Promise<HorarioEmpleado[]> {
    const rows = await this.orm.db
      .select()
      .from(horariosEmpleado)
      .where(eq(horariosEmpleado.empleadoId, empleadoId))
      .orderBy(horariosEmpleado.diaSemana);
    return rows.map((row) => this.toDomain(row));
  }

  /**
   * Reemplazo completo: borra todo lo que había y reinserta lo nuevo, dentro
   * de una transacción — evita dejar el horario a medio pisar si algo falla
   * a mitad de camino.
   */
  async setHorarios(empleadoId: string, horarios: SetHorarioInput[]): Promise<HorarioEmpleado[]> {
    return this.orm.db.transaction(async (tx) => {
      await tx.delete(horariosEmpleado).where(eq(horariosEmpleado.empleadoId, empleadoId));
      if (horarios.length === 0) return [];
      const rows = await tx
        .insert(horariosEmpleado)
        .values(
          horarios.map((h) => ({
            empleadoId,
            diaSemana: h.diaSemana,
            horaEntrada: h.horaEntrada,
            horaSalida: h.horaSalida,
          })),
        )
        .returning();
      return rows.map((row) => this.toDomain(row));
    });
  }

  async deleteByEmpleado(empleadoId: string): Promise<void> {
    await this.orm.db.delete(horariosEmpleado).where(eq(horariosEmpleado.empleadoId, empleadoId));
  }

  private toDomain(row: typeof horariosEmpleado.$inferSelect): HorarioEmpleado {
    return {
      id: row.id,
      empleadoId: row.empleadoId,
      diaSemana: row.diaSemana,
      horaEntrada: row.horaEntrada,
      horaSalida: row.horaSalida,
    };
  }
}
