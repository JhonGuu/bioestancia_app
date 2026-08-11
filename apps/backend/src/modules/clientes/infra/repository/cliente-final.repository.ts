import { and, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  ClienteFinalRepository,
  CreateClienteFinalInput,
} from "@/modules/clientes/domain/cliente-final.repository";
import { ClienteFinal } from "@/modules/clientes/domain/cliente-final";
import { clientesFinales } from "@/modules/clientes/infra/database/schema";

@injectable()
export class ClienteFinalRepositoryDrizzle implements ClienteFinalRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<ClienteFinal | null> {
    const [row] = await this.orm.db
      .select()
      .from(clientesFinales)
      .where(and(eq(clientesFinales.id, id), eq(clientesFinales.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async listByCliente(clienteId: string, empresaId: string): Promise<ClienteFinal[]> {
    const rows = await this.orm.db
      .select()
      .from(clientesFinales)
      .where(
        and(
          eq(clientesFinales.clienteId, clienteId),
          eq(clientesFinales.empresaId, empresaId),
          eq(clientesFinales.activo, true),
        ),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateClienteFinalInput): Promise<ClienteFinal> {
    const [row] = await this.orm.db
      .insert(clientesFinales)
      .values({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        nombre: input.nombre,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create cliente final", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof clientesFinales.$inferSelect): ClienteFinal {
    return {
      id: row.id,
      empresaId: row.empresaId,
      clienteId: row.clienteId,
      nombre: row.nombre,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
