import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  ClienteRepository,
  CreateClienteInput,
} from "@/modules/clientes/domain/cliente.repository";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { clientes } from "@/modules/clientes/infra/database/schema";

@injectable()
export class ClienteRepositoryDrizzle implements ClienteRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  async getById(id: string, empresaId: string): Promise<Cliente | null> {
    const [row] = await this.orm.db
      .select()
      .from(clientes)
      .where(
        and(
          eq(clientes.id, id),
          eq(clientes.empresaId, empresaId),
          isNull(clientes.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<Cliente[]> {
    const rows = await this.orm.db
      .select()
      .from(clientes)
      .where(and(eq(clientes.empresaId, empresaId), isNull(clientes.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateClienteInput): Promise<Cliente> {
    const [row] = await this.orm.db
      .insert(clientes)
      .values({
        empresaId: input.empresaId,
        listaDePreciosId: input.listaDePreciosId ?? null,
        nombre: input.nombre ?? null,
        apellido: input.apellido ?? null,
        razonSocial: input.razonSocial ?? null,
        cuit: input.cuit ?? null,
        dni: input.dni ?? null,
        domicilio: input.domicilio ?? null,
        email: input.email ?? null,
        pais: input.pais ?? null,
        provincia: input.provincia ?? null,
        ubicacion: input.ubicacion ?? null,
        condicionFiscal: input.condicionFiscal,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create cliente", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof clientes.$inferSelect): Cliente {
    return {
      id: row.id,
      empresaId: row.empresaId,
      listaDePreciosId: row.listaDePreciosId,
      nombre: row.nombre,
      apellido: row.apellido,
      razonSocial: row.razonSocial,
      cuit: row.cuit,
      dni: row.dni,
      domicilio: row.domicilio,
      email: row.email,
      pais: row.pais,
      provincia: row.provincia,
      ubicacion: row.ubicacion,
      condicionFiscal: row.condicionFiscal as CondicionFiscal,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
