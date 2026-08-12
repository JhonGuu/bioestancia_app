import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CargoCuentaCorrienteRepository,
  CreateCargoCuentaCorrienteInput,
} from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { cargosCuentaCorriente } from "@/modules/cargos-cuenta-corriente/infra/database/schema";

@injectable()
export class CargoCuentaCorrienteRepositoryDrizzle implements CargoCuentaCorrienteRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<CargoCuentaCorriente | null> {
    const [row] = await this.orm.db
      .select()
      .from(cargosCuentaCorriente)
      .where(
        and(
          eq(cargosCuentaCorriente.id, id),
          eq(cargosCuentaCorriente.empresaId, empresaId),
          isNull(cargosCuentaCorriente.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, clienteId?: string): Promise<CargoCuentaCorriente[]> {
    const condiciones = [eq(cargosCuentaCorriente.empresaId, empresaId), isNull(cargosCuentaCorriente.deletedAt)];
    if (clienteId) condiciones.push(eq(cargosCuentaCorriente.clienteId, clienteId));

    const rows = await this.orm.db
      .select()
      .from(cargosCuentaCorriente)
      .where(and(...condiciones));
    return rows.map((row) => this.toDomain(row));
  }

  async getByChequeYTipo(
    chequeId: string,
    tipo: TipoCargo,
    empresaId: string,
  ): Promise<CargoCuentaCorriente | null> {
    const [row] = await this.orm.db
      .select()
      .from(cargosCuentaCorriente)
      .where(
        and(
          eq(cargosCuentaCorriente.chequeId, chequeId),
          eq(cargosCuentaCorriente.tipo, tipo),
          eq(cargosCuentaCorriente.empresaId, empresaId),
          isNull(cargosCuentaCorriente.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateCargoCuentaCorrienteInput): Promise<CargoCuentaCorriente> {
    const [row] = await this.orm.db
      .insert(cargosCuentaCorriente)
      .values({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        tipo: input.tipo,
        monto: String(input.monto),
        chequeId: input.chequeId ?? null,
        motivo: input.motivo ?? null,
        fecha: input.fecha,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create cargo de cuenta corriente", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof cargosCuentaCorriente.$inferSelect): CargoCuentaCorriente {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId,
      tipo: row.tipo as TipoCargo,
      monto: Number(row.monto),
      chequeId: row.chequeId,
      motivo: row.motivo,
      fecha: row.fecha,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
