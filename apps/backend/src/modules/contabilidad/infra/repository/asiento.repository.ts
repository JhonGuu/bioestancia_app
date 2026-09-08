import { and, eq, gte, inArray, lte, max } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  Asiento,
  EstadoAsiento,
  LineaAsiento,
  RespaldoAsiento,
  TipoAsiento,
} from "@/modules/contabilidad/domain/asiento";
import {
  AsientoRepository,
  CreateAsientoInput,
  LineaAsientoInput,
  ListarAsientosFiltros,
  UpdateAsientoInput,
} from "@/modules/contabilidad/domain/asiento.repository";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { asientoLineas, asientos } from "@/modules/contabilidad/infra/database/schema";

@injectable()
export class AsientoRepositoryDrizzle implements AsientoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async list(filtros: ListarAsientosFiltros): Promise<Asiento[]> {
    const condiciones = [eq(asientos.empresaId, filtros.empresaId)];
    if (filtros.ejercicioId) condiciones.push(eq(asientos.ejercicioId, filtros.ejercicioId));
    if (filtros.periodoId) condiciones.push(eq(asientos.periodoId, filtros.periodoId));
    if (filtros.desde) condiciones.push(gte(asientos.fecha, filtros.desde));
    if (filtros.hasta) condiciones.push(lte(asientos.fecha, filtros.hasta));
    if (filtros.tipo) condiciones.push(eq(asientos.tipo, filtros.tipo));
    if (filtros.estado) condiciones.push(eq(asientos.estado, filtros.estado));
    if (filtros.respaldo) condiciones.push(eq(asientos.respaldo, filtros.respaldo));

    // Filtro por cuenta: primero qué asientos la tienen imputada, después el
    // listado. Dos queries en vez de un join para no duplicar cabeceras.
    if (filtros.cuentaId) {
      const conLaCuenta = await this.orm.db
        .selectDistinct({ asientoId: asientoLineas.asientoId })
        .from(asientoLineas)
        .where(eq(asientoLineas.cuentaId, filtros.cuentaId));
      const ids = conLaCuenta.map((row) => row.asientoId);
      if (ids.length === 0) return [];
      condiciones.push(inArray(asientos.id, ids));
    }

    const cabeceras = await this.orm.db
      .select()
      .from(asientos)
      .where(and(...condiciones))
      .orderBy(asientos.fecha, asientos.numero);
    if (cabeceras.length === 0) return [];

    // Una sola query para todas las líneas (en vez de una por asiento).
    const lineas = await this.orm.db
      .select()
      .from(asientoLineas)
      .where(
        inArray(
          asientoLineas.asientoId,
          cabeceras.map((c) => c.id),
        ),
      )
      .orderBy(asientoLineas.orden);

    const porAsiento = new Map<string, LineaAsiento[]>();
    for (const linea of lineas) {
      const lista = porAsiento.get(linea.asientoId) ?? [];
      lista.push(this.toLineaDomain(linea));
      porAsiento.set(linea.asientoId, lista);
    }

    return cabeceras.map((cabecera) => this.toDomain(cabecera, porAsiento.get(cabecera.id) ?? []));
  }

  async getById(id: string, empresaId: string): Promise<Asiento | null> {
    const [cabecera] = await this.orm.db
      .select()
      .from(asientos)
      .where(and(eq(asientos.id, id), eq(asientos.empresaId, empresaId)));
    if (!cabecera) return null;

    const lineas = await this.orm.db
      .select()
      .from(asientoLineas)
      .where(eq(asientoLineas.asientoId, id))
      .orderBy(asientoLineas.orden);

    return this.toDomain(
      cabecera,
      lineas.map((linea) => this.toLineaDomain(linea)),
    );
  }

  async getByOrigen(empresaId: string, origenTipo: string, origenId: string): Promise<Asiento | null> {
    const [cabecera] = await this.orm.db
      .select({ id: asientos.id })
      .from(asientos)
      .where(
        and(
          eq(asientos.empresaId, empresaId),
          eq(asientos.origenTipo, origenTipo),
          eq(asientos.origenId, origenId),
        ),
      );
    return cabecera ? this.getById(cabecera.id, empresaId) : null;
  }

  async existePorTipo(ejercicioId: string, tipo: TipoAsiento): Promise<boolean> {
    const rows = await this.orm.db
      .select({ id: asientos.id })
      .from(asientos)
      .where(and(eq(asientos.ejercicioId, ejercicioId), eq(asientos.tipo, tipo)));
    return rows.length > 0;
  }

  async create(input: CreateAsientoInput): Promise<Asiento> {
    const id = await this.orm.db.transaction(async (tx) => {
      const [cabecera] = await tx
        .insert(asientos)
        .values({
          empresaId: input.empresaId,
          ejercicioId: input.ejercicioId,
          periodoId: input.periodoId,
          numero: input.numero ?? null,
          fecha: input.fecha,
          tipo: input.tipo,
          estado: input.estado,
          respaldo: input.respaldo,
          descripcion: input.descripcion,
          origenTipo: input.origenTipo ?? null,
          origenId: input.origenId ?? null,
        })
        .returning({ id: asientos.id });
      if (!cabecera) throw new ApiError("No se pudo crear el asiento", Code.INTERNAL_SERVER_ERROR);

      await tx.insert(asientoLineas).values(this.toLineaRows(cabecera.id, input.lineas, input.fecha));
      return cabecera.id;
    });

    const creado = await this.getById(id, input.empresaId);
    if (!creado) throw new ApiError("No se pudo leer el asiento creado", Code.INTERNAL_SERVER_ERROR);
    return creado;
  }

  async update(id: string, empresaId: string, input: UpdateAsientoInput): Promise<Asiento> {
    await this.orm.db.transaction(async (tx) => {
      const [cabecera] = await tx
        .update(asientos)
        .set({
          ...(input.fecha !== undefined && { fecha: input.fecha }),
          ...(input.periodoId !== undefined && { periodoId: input.periodoId }),
          ...(input.respaldo !== undefined && { respaldo: input.respaldo }),
          ...(input.descripcion !== undefined && { descripcion: input.descripcion }),
          updatedAt: new Date(),
        })
        .where(and(eq(asientos.id, id), eq(asientos.empresaId, empresaId)))
        .returning({ id: asientos.id, fecha: asientos.fecha });
      if (!cabecera) throw new ApiError("El asiento no existe", Code.NOT_FOUND);

      // Editar un asiento reemplaza sus líneas por completo: es más simple y
      // más seguro que diffear cuál cambió, y son pocas por asiento.
      if (input.lineas) {
        await tx.delete(asientoLineas).where(eq(asientoLineas.asientoId, id));
        await tx.insert(asientoLineas).values(this.toLineaRows(id, input.lineas, cabecera.fecha));
      }
    });

    const actualizado = await this.getById(id, empresaId);
    if (!actualizado) throw new ApiError("El asiento no existe", Code.NOT_FOUND);
    return actualizado;
  }

  async cambiarEstado(
    id: string,
    empresaId: string,
    estado: EstadoAsiento,
    numero?: number,
  ): Promise<Asiento> {
    const [row] = await this.orm.db
      .update(asientos)
      .set({ estado, ...(numero !== undefined && { numero }), updatedAt: new Date() })
      .where(and(eq(asientos.id, id), eq(asientos.empresaId, empresaId)))
      .returning({ id: asientos.id });
    if (!row) throw new ApiError("El asiento no existe", Code.NOT_FOUND);

    const actualizado = await this.getById(id, empresaId);
    if (!actualizado) throw new ApiError("El asiento no existe", Code.NOT_FOUND);
    return actualizado;
  }

  async delete(id: string, empresaId: string): Promise<void> {
    // Las líneas se van solas por el `onDelete: cascade` del schema.
    await this.orm.db.delete(asientos).where(and(eq(asientos.id, id), eq(asientos.empresaId, empresaId)));
  }

  async siguienteNumero(ejercicioId: string): Promise<number> {
    const [row] = await this.orm.db
      .select({ maximo: max(asientos.numero) })
      .from(asientos)
      .where(eq(asientos.ejercicioId, ejercicioId));
    return (row?.maximo ?? 0) + 1;
  }

  private toLineaRows(asientoId: string, lineas: LineaAsientoInput[], fechaAsiento: Date) {
    return lineas.map((linea, indice) => ({
      asientoId,
      orden: indice,
      cuentaId: linea.cuentaId,
      debe: String(linea.debe),
      haber: String(linea.haber),
      detalle: linea.detalle ?? null,
      auxiliarTipo: linea.auxiliarTipo ?? null,
      auxiliarId: linea.auxiliarId ?? null,
      // Por defecto la partida se anticúa a la fecha del asiento.
      fechaOrigen: linea.fechaOrigen ?? fechaAsiento,
      centroCostoId: linea.centroCostoId ?? null,
    }));
  }

  private toDomain(row: typeof asientos.$inferSelect, lineas: LineaAsiento[]): Asiento {
    return {
      id: row.id,
      empresaId: row.empresaId,
      ejercicioId: row.ejercicioId,
      periodoId: row.periodoId,
      numero: row.numero,
      fecha: row.fecha,
      tipo: row.tipo as TipoAsiento,
      estado: row.estado as EstadoAsiento,
      respaldo: row.respaldo as RespaldoAsiento,
      descripcion: row.descripcion,
      origenTipo: row.origenTipo,
      origenId: row.origenId,
      lineas,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toLineaDomain(row: typeof asientoLineas.$inferSelect): LineaAsiento {
    return {
      id: row.id,
      asientoId: row.asientoId,
      orden: row.orden,
      cuentaId: row.cuentaId,
      debe: Number(row.debe),
      haber: Number(row.haber),
      detalle: row.detalle,
      auxiliarTipo: row.auxiliarTipo as TipoAuxiliar | null,
      auxiliarId: row.auxiliarId,
      fechaOrigen: row.fechaOrigen,
      centroCostoId: row.centroCostoId,
    };
  }
}
