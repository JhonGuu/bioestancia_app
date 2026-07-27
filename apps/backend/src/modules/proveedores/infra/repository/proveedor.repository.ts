import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateProveedorInput,
  ProveedorRepository,
} from "@/modules/proveedores/domain/proveedor.repository";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { proveedores } from "@/modules/proveedores/infra/database/schema";

@injectable()
export class ProveedorRepositoryDrizzle implements ProveedorRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  async getById(id: string, empresaId: string): Promise<Proveedor | null> {
    const [row] = await this.orm.db
      .select()
      .from(proveedores)
      .where(
        and(
          eq(proveedores.id, id),
          eq(proveedores.empresaId, empresaId),
          isNull(proveedores.deletedAt),
        ),
      );
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string): Promise<Proveedor[]> {
    const rows = await this.orm.db
      .select()
      .from(proveedores)
      .where(and(eq(proveedores.empresaId, empresaId), isNull(proveedores.deletedAt)));
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateProveedorInput): Promise<Proveedor> {
    const [row] = await this.orm.db
      .insert(proveedores)
      .values({
        empresaId: input.empresaId,
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
        datosBancarios: input.datosBancarios ?? null,
        porcentajeDesbaste:
          input.porcentajeDesbaste !== undefined ? String(input.porcentajeDesbaste) : null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create proveedor", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  private toDomain(row: typeof proveedores.$inferSelect): Proveedor {
    return {
      id: row.id,
      empresaId: row.empresaId,
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
      datosBancarios: row.datosBancarios,
      porcentajeDesbaste: row.porcentajeDesbaste !== null ? Number(row.porcentajeDesbaste) : null,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
