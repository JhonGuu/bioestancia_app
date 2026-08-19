import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  CreateEmpleadoInput,
  EmpleadoRepository,
  EstadoEmpleadoFiltro,
  UpdateEmpleadoInput,
} from "@/modules/personal/domain/empleado.repository";
import {
  Empleado,
  EstadoCivil,
  ModalidadTrabajo,
  TipoContrato,
} from "@/modules/personal/domain/empleado";
import { empleados } from "@/modules/personal/infra/database/schema";

@injectable()
export class EmpleadoRepositoryDrizzle implements EmpleadoRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getById(id: string, empresaId: string): Promise<Empleado | null> {
    const [row] = await this.orm.db
      .select()
      .from(empleados)
      .where(and(eq(empleados.id, id), eq(empleados.empresaId, empresaId)));
    return row ? this.toDomain(row) : null;
  }

  async list(empresaId: string, estado: EstadoEmpleadoFiltro = "activos"): Promise<Empleado[]> {
    const filtroEstado =
      estado === "activos"
        ? isNull(empleados.deletedAt)
        : estado === "inactivos"
          ? isNotNull(empleados.deletedAt)
          : undefined;
    const rows = await this.orm.db
      .select()
      .from(empleados)
      .where(
        filtroEstado
          ? and(eq(empleados.empresaId, empresaId), filtroEstado)
          : eq(empleados.empresaId, empresaId),
      );
    return rows.map((row) => this.toDomain(row));
  }

  async create(input: CreateEmpleadoInput): Promise<Empleado> {
    const [row] = await this.orm.db
      .insert(empleados)
      .values({ ...this.camposComunes(input), empresaId: input.empresaId })
      .returning();
    if (!row) throw new ApiError("Failed to create empleado", Code.INTERNAL_SERVER_ERROR);
    return this.toDomain(row);
  }

  async update(id: string, empresaId: string, input: UpdateEmpleadoInput): Promise<Empleado> {
    const [row] = await this.orm.db
      .update(empleados)
      .set({ ...this.camposComunes(input), updatedAt: new Date() })
      .where(and(eq(empleados.id, id), eq(empleados.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const [row] = await this.orm.db
      .update(empleados)
      .set({ deletedAt: new Date(), activo: false, updatedAt: new Date() })
      .where(and(eq(empleados.id, id), eq(empleados.empresaId, empresaId), isNull(empleados.deletedAt)))
      .returning();
    if (!row) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);
  }

  async reactivar(id: string, empresaId: string): Promise<Empleado> {
    const [row] = await this.orm.db
      .update(empleados)
      .set({ deletedAt: null, activo: true, updatedAt: new Date() })
      .where(and(eq(empleados.id, id), eq(empleados.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async setDniArchivoPath(id: string, empresaId: string, path: string | null): Promise<Empleado> {
    const [row] = await this.orm.db
      .update(empleados)
      .set({ dniArchivoPath: path, updatedAt: new Date() })
      .where(and(eq(empleados.id, id), eq(empleados.empresaId, empresaId)))
      .returning();
    if (!row) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);
    return this.toDomain(row);
  }

  async setNombreDispositivo(id: string, empresaId: string, nombreDispositivo: string): Promise<void> {
    await this.orm.db
      .update(empleados)
      .set({ nombreDispositivo, updatedAt: new Date() })
      .where(and(eq(empleados.id, id), eq(empleados.empresaId, empresaId)));
  }

  async listConNombreDispositivo(empresaId: string): Promise<Empleado[]> {
    const rows = await this.orm.db
      .select()
      .from(empleados)
      .where(
        and(
          eq(empleados.empresaId, empresaId),
          isNull(empleados.deletedAt),
          isNotNull(empleados.nombreDispositivo),
        ),
      );
    return rows.map((row) => this.toDomain(row));
  }

  /**
   * Campos que create/update comparten (todo salvo `empresaId`, que create
   * agrega aparte porque es obligatorio para el insert y update no lo toca).
   */
  private camposComunes(input: UpdateEmpleadoInput) {
    return {
      nombre: input.nombre,
      apellido: input.apellido,
      dni: input.dni,
      cuil: input.cuil ?? null,
      domicilio: input.domicilio ?? null,
      telefono: input.telefono ?? null,
      fechaNacimiento: input.fechaNacimiento ?? null,
      estadoCivil: input.estadoCivil ?? null,
      contactoEmergenciaNombre: input.contactoEmergenciaNombre ?? null,
      contactoEmergenciaTelefono: input.contactoEmergenciaTelefono ?? null,
      fechaIngreso: input.fechaIngreso,
      cargoId: input.cargoId ?? null,
      categoriaProfesional: input.categoriaProfesional ?? null,
      convenioColectivo: input.convenioColectivo ?? null,
      tipoContrato: input.tipoContrato ?? null,
      modalidad: input.modalidad ?? null,
      lugarPrestacionTareas: input.lugarPrestacionTareas ?? null,
      datosBancarios: input.datosBancarios ?? null,
      nombreDispositivo: input.nombreDispositivo ?? null,
      toleranciaMinutos: input.toleranciaMinutos ?? null,
    };
  }

  private toDomain(row: typeof empleados.$inferSelect): Empleado {
    return {
      id: row.id,
      empresaId: row.empresaId,
      nombre: row.nombre,
      apellido: row.apellido,
      dni: row.dni,
      dniArchivoPath: row.dniArchivoPath,
      cuil: row.cuil,
      domicilio: row.domicilio,
      telefono: row.telefono,
      fechaNacimiento: row.fechaNacimiento,
      estadoCivil: row.estadoCivil as EstadoCivil | null,
      contactoEmergenciaNombre: row.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: row.contactoEmergenciaTelefono,
      fechaIngreso: row.fechaIngreso,
      cargoId: row.cargoId,
      categoriaProfesional: row.categoriaProfesional,
      convenioColectivo: row.convenioColectivo,
      tipoContrato: row.tipoContrato as TipoContrato | null,
      modalidad: row.modalidad as ModalidadTrabajo | null,
      lugarPrestacionTareas: row.lugarPrestacionTareas,
      datosBancarios: row.datosBancarios,
      nombreDispositivo: row.nombreDispositivo,
      toleranciaMinutos: row.toleranciaMinutos,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
