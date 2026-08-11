import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateProveedorInput,
  EstadoProveedorFiltro,
  ProveedorRepository,
  UpdateProveedorInput,
} from "@/modules/proveedores/domain/proveedor.repository";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { CodigoAfipPorcino } from "@/modules/proveedores/domain/codigo-afip-porcino";
import { proveedores } from "@/modules/proveedores/infra/database/schema";

@injectable()
export class ProveedorRepositoryDrizzle implements ProveedorRepository {
  constructor(
    @inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter,
  ) {}

  /**
   * A diferencia de `list()`, NO filtra `isNull(deletedAt)` — un proveedor
   * inactivo tiene que poder seguir resolviéndose por id (para editarlo
   * antes de reactivarlo, y para que compras históricas que lo referencian
   * no dejen de encontrarlo). El soft-delete solo lo saca de listados/selectores.
   */
  async getById(id: string, empresaId: string): Promise<Proveedor | null> {
    const [row] = await this.orm.db
      .select()
      .from(proveedores)
      .where(and(eq(proveedores.id, id), eq(proveedores.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, estado: EstadoProveedorFiltro = "activos"): Promise<Proveedor[]> {
    const filtroEstado =
      estado === "activos"
        ? isNull(proveedores.deletedAt)
        : estado === "inactivos"
          ? isNotNull(proveedores.deletedAt)
          : undefined;
    const rows = await this.orm.db
      .select()
      .from(proveedores)
      .where(filtroEstado ? and(eq(proveedores.empresaId, empresaId), filtroEstado) : eq(proveedores.empresaId, empresaId));
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
        renspa: input.renspa ?? null,
        codigoAfip: input.codigoAfip ?? null,
      })
      .returning();
    if (!row) {
      throw new ApiError("Failed to create proveedor", Code.INTERNAL_SERVER_ERROR);
    }
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateProveedorInput): Promise<Proveedor> {
    const [row] = await this.orm.db
      .update(proveedores)
      .set({
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
        renspa: input.renspa ?? null,
        codigoAfip: input.codigoAfip ?? null,
        updatedAt: new Date(),
      })
      // Sin filtrar `isNull(deletedAt)` — se puede editar un proveedor
      // inactivo (ej. corregir un dato antes de reactivarlo) sin que la
      // edición en sí lo reactive.
      .where(and(eq(proveedores.id, id), eq(proveedores.empresaId, empresaId)))
      .returning();
    if (!row) {
      throw new ApiError("Proveedor no encontrado", Code.NOT_FOUND);
    }
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(proveedores)
      .set({ deletedAt: new Date(), activo: false, updatedAt: new Date() })
      .where(
        and(eq(proveedores.id, id), eq(proveedores.empresaId, empresaId), isNull(proveedores.deletedAt)),
      )
      .returning();
    if (!row) {
      throw new ApiError("Proveedor no encontrado", Code.NOT_FOUND);
    }
  }

  async reactivar(id: string, empresaId: string): Promise<Proveedor> {
    const [row] = await this.orm.db
      .update(proveedores)
      .set({ deletedAt: null, activo: true, updatedAt: new Date() })
      .where(and(eq(proveedores.id, id), eq(proveedores.empresaId, empresaId)))
      .returning();
    if (!row) {
      throw new ApiError("Proveedor no encontrado", Code.NOT_FOUND);
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
      renspa: row.renspa,
      codigoAfip: row.codigoAfip as CodigoAfipPorcino | null,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
