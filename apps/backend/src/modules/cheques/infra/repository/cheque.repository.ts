import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  ActualizarEstadoChequeInput,
  ChequeRepository,
  CreateChequeInput,
  ListChequesFiltro,
} from "@/modules/cheques/domain/cheque.repository";
import { Cheque } from "@/modules/cheques/domain/cheque";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";
import { cheques } from "@/modules/cheques/infra/database/schema";

@injectable()
export class ChequeRepositoryDrizzle implements ChequeRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Cheque | null> {
    const [row] = await this.orm.db
      .select()
      .from(cheques)
      .where(and(eq(cheques.id, id), eq(cheques.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, filtro?: ListChequesFiltro): Promise<Cheque[]> {
    const condiciones = [eq(cheques.empresaId, empresaId)];
    if (filtro?.estado) condiciones.push(eq(cheques.estado, filtro.estado));
    if (filtro?.clienteId) condiciones.push(eq(cheques.clienteId, filtro.clienteId));

    const rows = await this.orm.db
      .select()
      .from(cheques)
      .where(and(...condiciones));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateChequeInput): Promise<Cheque> {
    const [row] = await this.orm.db
      .insert(cheques)
      .values({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        numero: input.numero,
        banco: input.banco,
        cuitLibrador: input.cuitLibrador ?? null,
        titular: input.titular ?? null,
        fechaEmision: input.fechaEmision,
        fechaPago: input.fechaPago,
        monto: String(input.monto),
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create cheque", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async actualizarEstado(
    id: string,
    empresaId: string,
    input: ActualizarEstadoChequeInput,
  ): Promise<Cheque> {
    const [row] = await this.orm.db
      .update(cheques)
      .set({
        estado: input.estado,
        motivoRechazo: input.motivoRechazo ?? null,
        fechaUltimoCambioEstado: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(cheques.id, id), eq(cheques.empresaId, empresaId)))
      .returning();
    if (!row) {
      throw new ApiError("Cheque no encontrado", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof cheques.$inferSelect): Cheque {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId,
      numero: row.numero,
      banco: row.banco,
      cuitLibrador: row.cuitLibrador,
      titular: row.titular,
      fechaEmision: row.fechaEmision,
      fechaPago: row.fechaPago,
      monto: Number(row.monto),
      estado: row.estado as EstadoCheque,
      fechaUltimoCambioEstado: row.fechaUltimoCambioEstado,
      motivoRechazo: row.motivoRechazo,
      comentarios: row.comentarios,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
