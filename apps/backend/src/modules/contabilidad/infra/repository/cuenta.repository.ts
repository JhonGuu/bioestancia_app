import { and, count, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import {
  CreateCuentaInput,
  CuentaRepository,
  UpdateCuentaInput,
} from "@/modules/contabilidad/domain/cuenta.repository";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import { asientoLineas, planCuentas } from "@/modules/contabilidad/infra/database/schema";

@injectable()
export class CuentaRepositoryDrizzle implements CuentaRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async list(empresaId: string, incluirInactivas = true): Promise<Cuenta[]> {
    const condiciones = [eq(planCuentas.empresaId, empresaId)];
    if (!incluirInactivas) condiciones.push(eq(planCuentas.activa, true));

    const rows = await this.orm.db
      .select()
      .from(planCuentas)
      .where(and(...condiciones))
      .orderBy(planCuentas.codigo);
    return rows.map((row) => this.toDomain(row));
  }

  async getById(id: string, empresaId: string): Promise<Cuenta | null> {
    const [row] = await this.orm.db
      .select()
      .from(planCuentas)
      .where(and(eq(planCuentas.id, id), eq(planCuentas.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async getByCodigo(codigo: string, empresaId: string): Promise<Cuenta | null> {
    const [row] = await this.orm.db
      .select()
      .from(planCuentas)
      .where(and(eq(planCuentas.codigo, codigo), eq(planCuentas.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async create(input: CreateCuentaInput): Promise<Cuenta> {
    const [row] = await this.orm.db.insert(planCuentas).values(this.toRow(input)).returning();
    if (!row) throw new ApiError("No se pudo crear la cuenta", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async createMany(inputs: CreateCuentaInput[]): Promise<Cuenta[]> {
    if (inputs.length === 0) return [];
    const rows = await this.orm.db
      .insert(planCuentas)
      .values(inputs.map((input) => this.toRow(input)))
      .returning();
    return rows.map((row) => this.toDomain(row));
  }

  async update(id: string, empresaId: string, input: UpdateCuentaInput): Promise<Cuenta> {
    const [row] = await this.orm.db
      .update(planCuentas)
      .set({
        ...(input.codigo !== undefined && { codigo: input.codigo }),
        ...(input.nombre !== undefined && { nombre: input.nombre }),
        ...(input.tipo !== undefined && { tipo: input.tipo }),
        ...(input.parentId !== undefined && { parentId: input.parentId }),
        ...(input.imputable !== undefined && { imputable: input.imputable }),
        ...(input.monetaria !== undefined && { monetaria: input.monetaria }),
        ...(input.requiereAuxiliar !== undefined && { requiereAuxiliar: input.requiereAuxiliar }),
        ...(input.activa !== undefined && { activa: input.activa }),
        updatedAt: new Date(),
      })
      .where(and(eq(planCuentas.id, id), eq(planCuentas.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("La cuenta no existe", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async desactivar(id: string, empresaId: string): Promise<void> {
    await this.orm.db
      .update(planCuentas)
      .set({ activa: false, updatedAt: new Date() })
      .where(and(eq(planCuentas.id, id), eq(planCuentas.empresaId, empresaId)));
  }

  async delete(id: string, empresaId: string): Promise<void> {
    await this.orm.db
      .delete(planCuentas)
      .where(and(eq(planCuentas.id, id), eq(planCuentas.empresaId, empresaId)));
  }

  async tieneMovimientos(id: string): Promise<boolean> {
    const [row] = await this.orm.db
      .select({ total: count() })
      .from(asientoLineas)
      .where(eq(asientoLineas.cuentaId, id));
    return (row?.total ?? 0) > 0;
  }

  async tieneHijos(id: string): Promise<boolean> {
    const [row] = await this.orm.db
      .select({ total: count() })
      .from(planCuentas)
      .where(eq(planCuentas.parentId, id));
    return (row?.total ?? 0) > 0;
  }

  async contar(empresaId: string): Promise<number> {
    const [row] = await this.orm.db
      .select({ total: count() })
      .from(planCuentas)
      .where(eq(planCuentas.empresaId, empresaId));
    return row?.total ?? 0;
  }

  private toRow(input: CreateCuentaInput) {
    return {
      empresaId: input.empresaId,
      codigo: input.codigo,
      nombre: input.nombre,
      tipo: input.tipo,
      parentId: input.parentId ?? null,
      imputable: input.imputable,
      monetaria: input.monetaria,
      requiereAuxiliar: input.requiereAuxiliar ?? TipoAuxiliar.NINGUNO,
    };
  }

  private toDomain(row: typeof planCuentas.$inferSelect): Cuenta {
    return {
      id: row.id,
      empresaId: row.empresaId,
      codigo: row.codigo,
      nombre: row.nombre,
      tipo: row.tipo as TipoCuenta,
      parentId: row.parentId,
      imputable: row.imputable,
      monetaria: row.monetaria,
      requiereAuxiliar: row.requiereAuxiliar as TipoAuxiliar,
      activa: row.activa,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
