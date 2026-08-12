import { and, eq, inArray, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  AjusteAplicacionInput,
  CobroConLineas,
  CobroRepository,
  CrearAplicacionInput,
  CreateCobroInput,
} from "@/modules/cobros/domain/cobro.repository";
import { LineaCobro } from "@/modules/cobros/domain/linea-cobro";
import { AplicacionCobro } from "@/modules/cobros/domain/aplicacion-cobro";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { cobros, lineasCobro, aplicacionesCobro } from "@/modules/cobros/infra/database/schema";

@injectable()
export class CobroRepositoryDrizzle implements CobroRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<CobroConLineas | null> {
    const [row] = await this.orm.db
      .select()
      .from(cobros)
      .where(and(eq(cobros.id, id), eq(cobros.empresaId, empresaId), isNull(cobros.deletedAt)));
    if (!row) return null;
    const lineas = await this.getLineas([row.id]);
    return this.toDomain(row, lineas.get(row.id) ?? []);
  }

  async list(empresaId: string, clienteId?: string): Promise<CobroConLineas[]> {
    const condiciones = [eq(cobros.empresaId, empresaId), isNull(cobros.deletedAt)];
    if (clienteId) condiciones.push(eq(cobros.clienteId, clienteId));

    const rows = await this.orm.db
      .select()
      .from(cobros)
      .where(and(...condiciones));
    if (rows.length === 0) return [];

    const lineasPorCobro = await this.getLineas(rows.map((r) => r.id));
    return rows.map((row) => this.toDomain(row, lineasPorCobro.get(row.id) ?? []));
  }

  async create(input: CreateCobroInput): Promise<CobroConLineas> {
    const [row] = await this.orm.db
      .insert(cobros)
      .values({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        fecha: input.fecha,
        comentarios: input.comentarios ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create cobro", Code.INTERNAL_SERVER_ERROR);
    }

    if (input.lineas.length === 0) {
      return this.toDomain(row, []);
    }

    const lineasRows = await this.orm.db
      .insert(lineasCobro)
      .values(
        input.lineas.map((linea) => ({
          cobroId: row.id,
          medioPago: linea.medioPago,
          monto: String(linea.monto),
          chequeId: linea.chequeId,
        })),
      )
      .returning();

    return this.toDomain(row, lineasRows.map((l) => this.lineaToDomain(l)));
  }

  async crearAplicaciones(input: CrearAplicacionInput[]): Promise<AplicacionCobro[]> {
    if (input.length === 0) return [];
    const rows = await this.orm.db
      .insert(aplicacionesCobro)
      .values(
        input.map((aplicacion) => ({
          cobroId: aplicacion.cobroId,
          boletaId: aplicacion.boletaId,
          monto: String(aplicacion.monto),
        })),
      )
      .returning();
    return rows.map((row) => this.aplicacionToDomain(row));
  }

  async listAplicacionesByCliente(clienteId: string, empresaId: string): Promise<AplicacionCobro[]> {
    const rows = await this.orm.db
      .select({ aplicacion: aplicacionesCobro })
      .from(aplicacionesCobro)
      .innerJoin(cobros, eq(aplicacionesCobro.cobroId, cobros.id))
      .where(
        and(
          eq(cobros.clienteId, clienteId),
          eq(cobros.empresaId, empresaId),
          eq(cobros.activo, true),
          isNull(cobros.deletedAt),
        ),
      );
    return rows.map((r) => this.aplicacionToDomain(r.aplicacion));
  }

  async getByChequeId(chequeId: string, empresaId: string): Promise<CobroConLineas | null> {
    const [linea] = await this.orm.db
      .select({ cobroId: lineasCobro.cobroId })
      .from(lineasCobro)
      .where(eq(lineasCobro.chequeId, chequeId));
    if (!linea) return null;
    return this.getById(linea.cobroId, empresaId);
  }

  async ajustarAplicaciones(ajustes: AjusteAplicacionInput[]): Promise<void> {
    for (const ajuste of ajustes) {
      if (ajuste.nuevoMonto <= 0.01) {
        await this.orm.db.delete(aplicacionesCobro).where(eq(aplicacionesCobro.id, ajuste.id));
      } else {
        await this.orm.db
          .update(aplicacionesCobro)
          .set({ monto: String(ajuste.nuevoMonto) })
          .where(eq(aplicacionesCobro.id, ajuste.id));
      }
    }
  }

  /** Trae las líneas de varios cobros de una sola consulta, agrupadas por `cobroId`. */
  private async getLineas(cobroIds: string[]): Promise<Map<string, LineaCobro[]>> {
    if (cobroIds.length === 0) return new Map();
    const rows = await this.orm.db.select().from(lineasCobro).where(inArray(lineasCobro.cobroId, cobroIds));
    const mapa = new Map<string, LineaCobro[]>();
    for (const row of rows) {
      const linea = this.lineaToDomain(row);
      const arr = mapa.get(linea.cobroId) ?? [];
      arr.push(linea);
      mapa.set(linea.cobroId, arr);
    }
    return mapa;
  }

  private toDomain(row: typeof cobros.$inferSelect, lineas: LineaCobro[]): CobroConLineas {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId,
      fecha: row.fecha,
      comentarios: row.comentarios,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lineas,
    };
  }

  private lineaToDomain(row: typeof lineasCobro.$inferSelect): LineaCobro {
    return {
      id: row.id,
      cobroId: row.cobroId,
      medioPago: row.medioPago as MedioPago,
      monto: Number(row.monto),
      chequeId: row.chequeId,
      createdAt: row.createdAt,
    };
  }

  private aplicacionToDomain(row: typeof aplicacionesCobro.$inferSelect): AplicacionCobro {
    return {
      id: row.id,
      cobroId: row.cobroId,
      boletaId: row.boletaId,
      monto: Number(row.monto),
      createdAt: row.createdAt,
    };
  }
}
