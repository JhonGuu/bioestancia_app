import { and, eq, gte, lte, ne } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  Ejercicio,
  EstadoEjercicio,
  EstadoPeriodo,
  Periodo,
} from "@/modules/contabilidad/domain/ejercicio";
import {
  CreateEjercicioInput,
  EjercicioRepository,
} from "@/modules/contabilidad/domain/ejercicio.repository";
import { ejerciciosContables, periodosContables } from "@/modules/contabilidad/infra/database/schema";

@injectable()
export class EjercicioRepositoryDrizzle implements EjercicioRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async list(empresaId: string): Promise<Ejercicio[]> {
    const rows = await this.orm.db
      .select()
      .from(ejerciciosContables)
      .where(eq(ejerciciosContables.empresaId, empresaId))
      .orderBy(ejerciciosContables.numero);
    return rows.map((row) => this.toDomain(row));
  }

  async getById(id: string, empresaId: string): Promise<Ejercicio | null> {
    const [row] = await this.orm.db
      .select()
      .from(ejerciciosContables)
      .where(and(eq(ejerciciosContables.id, id), eq(ejerciciosContables.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async getByFecha(empresaId: string, fecha: Date): Promise<Ejercicio | null> {
    const [row] = await this.orm.db
      .select()
      .from(ejerciciosContables)
      .where(
        and(
          eq(ejerciciosContables.empresaId, empresaId),
          lte(ejerciciosContables.fechaInicio, fecha),
          gte(ejerciciosContables.fechaFin, fecha),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  /** Dos rangos se solapan si cada uno empieza antes de que termine el otro. */
  async existeSolapado(
    empresaId: string,
    fechaInicio: Date,
    fechaFin: Date,
    excluirId?: string,
  ): Promise<boolean> {
    const condiciones = [
      eq(ejerciciosContables.empresaId, empresaId),
      lte(ejerciciosContables.fechaInicio, fechaFin),
      gte(ejerciciosContables.fechaFin, fechaInicio),
    ];
    if (excluirId) condiciones.push(ne(ejerciciosContables.id, excluirId));

    const rows = await this.orm.db
      .select({ id: ejerciciosContables.id })
      .from(ejerciciosContables)
      .where(and(...condiciones));
    return rows.length > 0;
  }

  async create(input: CreateEjercicioInput): Promise<Ejercicio> {
    const [row] = await this.orm.db
      .insert(ejerciciosContables)
      .values({
        empresaId: input.empresaId,
        numero: input.numero,
        nombre: input.nombre,
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin,
      })
      .returning();
    if (!row) throw new ApiError("No se pudo crear el ejercicio", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async cambiarEstado(id: string, empresaId: string, estado: EstadoEjercicio): Promise<Ejercicio> {
    const [row] = await this.orm.db
      .update(ejerciciosContables)
      .set({ estado, updatedAt: new Date() })
      .where(and(eq(ejerciciosContables.id, id), eq(ejerciciosContables.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("El ejercicio no existe", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async listPeriodos(ejercicioId: string): Promise<Periodo[]> {
    const rows = await this.orm.db
      .select()
      .from(periodosContables)
      .where(eq(periodosContables.ejercicioId, ejercicioId))
      .orderBy(periodosContables.anio, periodosContables.mes);
    return rows.map((row) => this.toPeriodoDomain(row));
  }

  async getPeriodoById(id: string): Promise<Periodo | null> {
    const [row] = await this.orm.db.select().from(periodosContables).where(eq(periodosContables.id, id));
    return row ? this.toPeriodoDomain(row) : null;
  }

  async getPeriodoPorFecha(ejercicioId: string, fecha: Date): Promise<Periodo | null> {
    const [row] = await this.orm.db
      .select()
      .from(periodosContables)
      .where(
        and(
          eq(periodosContables.ejercicioId, ejercicioId),
          eq(periodosContables.anio, fecha.getUTCFullYear()),
          eq(periodosContables.mes, fecha.getUTCMonth() + 1),
        ),
      );
    return row ? this.toPeriodoDomain(row) : null;
  }

  async createPeriodos(
    ejercicioId: string,
    periodos: { anio: number; mes: number }[],
  ): Promise<Periodo[]> {
    if (periodos.length === 0) return [];
    const rows = await this.orm.db
      .insert(periodosContables)
      .values(periodos.map((p) => ({ ejercicioId, anio: p.anio, mes: p.mes })))
      .returning();
    return rows.map((row) => this.toPeriodoDomain(row));
  }

  async cambiarEstadoPeriodo(id: string, estado: EstadoPeriodo): Promise<Periodo> {
    const [row] = await this.orm.db
      .update(periodosContables)
      .set({
        estado,
        cerradoAt: estado === EstadoPeriodo.CERRADO ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(periodosContables.id, id))
      .returning();
    if (!row) throw new ApiError("El período no existe", Code.NOT_FOUND);
    return this.toPeriodoDomain(row);
  }

  private toDomain(row: typeof ejerciciosContables.$inferSelect): Ejercicio {
    return {
      id: row.id,
      empresaId: row.empresaId,
      numero: row.numero,
      nombre: row.nombre,
      fechaInicio: row.fechaInicio,
      fechaFin: row.fechaFin,
      estado: row.estado as EstadoEjercicio,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toPeriodoDomain(row: typeof periodosContables.$inferSelect): Periodo {
    return {
      id: row.id,
      ejercicioId: row.ejercicioId,
      anio: row.anio,
      mes: row.mes,
      estado: row.estado as EstadoPeriodo,
      cerradoAt: row.cerradoAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
