import { and, asc, eq, inArray, SQL } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  AuxiliarResolverRegla,
  EventoAsiento,
  ExpresionMontoRegla,
  LadoLineaRegla,
  ReglaAsiento,
  ReglaAsientoLinea,
} from "@/modules/contabilidad/domain/regla-asiento";
import {
  CreateReglaAsientoInput,
  ReglaAsientoRepository,
  UpdateReglaAsientoInput,
} from "@/modules/contabilidad/domain/regla-asiento.repository";
import { reglasAsiento, reglasAsientoLineas } from "@/modules/contabilidad/infra/database/schema";

@injectable()
export class ReglaAsientoRepositoryDrizzle implements ReglaAsientoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async list(empresaId: string): Promise<ReglaAsiento[]> {
    return this.listConCondiciones(eq(reglasAsiento.empresaId, empresaId));
  }

  async listByEvento(empresaId: string, evento: EventoAsiento): Promise<ReglaAsiento[]> {
    return this.listConCondiciones(and(eq(reglasAsiento.empresaId, empresaId), eq(reglasAsiento.evento, evento))!);
  }

  private async listConCondiciones(condicion: SQL): Promise<ReglaAsiento[]> {
    const cabeceras = await this.orm.db
      .select()
      .from(reglasAsiento)
      .where(condicion)
      .orderBy(asc(reglasAsiento.prioridad));
    if (cabeceras.length === 0) return [];

    const idsCabeceras = cabeceras.map((c) => c.id);
    const lineas = await this.orm.db
      .select()
      .from(reglasAsientoLineas)
      .where(inArray(reglasAsientoLineas.reglaId, idsCabeceras))
      .orderBy(asc(reglasAsientoLineas.orden));

    const porRegla = new Map<string, ReglaAsientoLinea[]>();
    for (const linea of lineas) {
      const lista = porRegla.get(linea.reglaId) ?? [];
      lista.push(this.toLineaDomain(linea));
      porRegla.set(linea.reglaId, lista);
    }

    return cabeceras.map((cabecera) => this.toDomain(cabecera, porRegla.get(cabecera.id) ?? []));
  }

  async getById(id: string, empresaId: string): Promise<ReglaAsiento | null> {
    const [cabecera] = await this.orm.db
      .select()
      .from(reglasAsiento)
      .where(and(eq(reglasAsiento.id, id), eq(reglasAsiento.empresaId, empresaId)));
    if (!cabecera) return null;

    const lineas = await this.orm.db
      .select()
      .from(reglasAsientoLineas)
      .where(eq(reglasAsientoLineas.reglaId, id))
      .orderBy(asc(reglasAsientoLineas.orden));

    return this.toDomain(
      cabecera,
      lineas.map((l) => this.toLineaDomain(l)),
    );
  }

  async create(input: CreateReglaAsientoInput): Promise<ReglaAsiento> {
    const id = await this.orm.db.transaction(async (tx) => {
      const [cabecera] = await tx
        .insert(reglasAsiento)
        .values({
          empresaId: input.empresaId,
          evento: input.evento,
          nombre: input.nombre,
          activa: input.activa ?? true,
          prioridad: input.prioridad ?? 0,
          condicion: input.condicion ?? null,
        })
        .returning({ id: reglasAsiento.id });
      if (!cabecera) throw new ApiError("No se pudo crear la regla de asiento", Code.INTERNAL_SERVER_ERROR);

      await tx.insert(reglasAsientoLineas).values(this.toLineaRows(cabecera.id, input.lineas));
      return cabecera.id;
    });

    const creada = await this.getById(id, input.empresaId);
    if (!creada) throw new ApiError("No se pudo leer la regla creada", Code.INTERNAL_SERVER_ERROR);
    return creada;
  }

  async update(id: string, empresaId: string, input: UpdateReglaAsientoInput): Promise<ReglaAsiento> {
    await this.orm.db.transaction(async (tx) => {
      const [cabecera] = await tx
        .update(reglasAsiento)
        .set({
          ...(input.nombre !== undefined && { nombre: input.nombre }),
          ...(input.activa !== undefined && { activa: input.activa }),
          ...(input.prioridad !== undefined && { prioridad: input.prioridad }),
          ...(input.condicion !== undefined && { condicion: input.condicion }),
          updatedAt: new Date(),
        })
        .where(and(eq(reglasAsiento.id, id), eq(reglasAsiento.empresaId, empresaId)))
        .returning({ id: reglasAsiento.id });
      if (!cabecera) throw new ApiError("La regla de asiento no existe", Code.NOT_FOUND);

      // Igual que editar un asiento: reemplaza las líneas por completo en vez de diffear (son pocas por regla).
      if (input.lineas) {
        await tx.delete(reglasAsientoLineas).where(eq(reglasAsientoLineas.reglaId, id));
        await tx.insert(reglasAsientoLineas).values(this.toLineaRows(id, input.lineas));
      }
    });

    const actualizada = await this.getById(id, empresaId);
    if (!actualizada) throw new ApiError("La regla de asiento no existe", Code.NOT_FOUND);
    return actualizada;
  }

  async delete(id: string, empresaId: string): Promise<void> {
    // Las líneas se van solas por el `onDelete: cascade` del schema.
    await this.orm.db
      .delete(reglasAsiento)
      .where(and(eq(reglasAsiento.id, id), eq(reglasAsiento.empresaId, empresaId)));
  }

  private toLineaRows(reglaId: string, lineas: CreateReglaAsientoInput["lineas"]) {
    return lineas.map((linea, indice) => ({
      reglaId,
      orden: indice,
      lado: linea.lado,
      cuentaId: linea.cuentaId,
      expresion: linea.expresion,
      auxiliarResolver: linea.auxiliarResolver ?? null,
    }));
  }

  private toLineaDomain(row: typeof reglasAsientoLineas.$inferSelect): ReglaAsientoLinea {
    return {
      id: row.id,
      reglaId: row.reglaId,
      orden: row.orden,
      lado: row.lado as LadoLineaRegla,
      cuentaId: row.cuentaId,
      expresion: row.expresion as ExpresionMontoRegla,
      auxiliarResolver: row.auxiliarResolver as AuxiliarResolverRegla | null,
    };
  }

  private toDomain(row: typeof reglasAsiento.$inferSelect, lineas: ReglaAsientoLinea[]): ReglaAsiento {
    return {
      id: row.id,
      empresaId: row.empresaId,
      evento: row.evento as EventoAsiento,
      nombre: row.nombre,
      activa: row.activa,
      prioridad: row.prioridad,
      condicion: row.condicion as Record<string, string> | null,
      lineas,
    };
  }
}
