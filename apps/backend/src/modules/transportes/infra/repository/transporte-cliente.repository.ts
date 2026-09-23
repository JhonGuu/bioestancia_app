import { and, eq, isNull } from "drizzle-orm";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { Chofer } from "@/modules/transportes/domain/chofer";
import { TipoVehiculo, Vehiculo } from "@/modules/transportes/domain/vehiculo";
import {
  TransporteCliente,
  TransporteClienteRepository,
} from "@/modules/transportes/domain/transporte-cliente.repository";
import {
  choferes,
  clienteChoferes,
  clienteVehiculos,
  vehiculos,
} from "@/modules/transportes/infra/database/schema";

@injectable()
export class TransporteClienteRepositoryDrizzle implements TransporteClienteRepository {
  constructor(@inject(DI_TYPES.DBConnection) private readonly orm: DrizzleAdapter) {}

  async getAutorizados(clienteId: string, empresaId: string): Promise<TransporteCliente> {
    const filasChoferes = await this.orm.db
      .select({ chofer: choferes })
      .from(clienteChoferes)
      .innerJoin(choferes, eq(clienteChoferes.choferId, choferes.id))
      .where(
        and(
          eq(clienteChoferes.clienteId, clienteId),
          eq(choferes.empresaId, empresaId),
          isNull(choferes.deletedAt),
        ),
      )
      .orderBy(choferes.apellido, choferes.nombre);

    const filasVehiculos = await this.orm.db
      .select({ vehiculo: vehiculos })
      .from(clienteVehiculos)
      .innerJoin(vehiculos, eq(clienteVehiculos.vehiculoId, vehiculos.id))
      .where(
        and(
          eq(clienteVehiculos.clienteId, clienteId),
          eq(vehiculos.empresaId, empresaId),
          isNull(vehiculos.deletedAt),
        ),
      )
      .orderBy(vehiculos.patente);

    return {
      choferes: filasChoferes.map((fila) => this.choferToDomain(fila.chofer)),
      vehiculos: filasVehiculos.map((fila) => this.vehiculoToDomain(fila.vehiculo)),
    };
  }

  async setAutorizados(
    clienteId: string,
    _empresaId: string,
    choferIds: string[],
    vehiculoIds: string[],
  ): Promise<void> {
    await this.orm.db.transaction(async (tx) => {
      await tx.delete(clienteChoferes).where(eq(clienteChoferes.clienteId, clienteId));
      await tx.delete(clienteVehiculos).where(eq(clienteVehiculos.clienteId, clienteId));
      if (choferIds.length > 0) {
        await tx
          .insert(clienteChoferes)
          .values(choferIds.map((choferId) => ({ clienteId, choferId })));
      }
      if (vehiculoIds.length > 0) {
        await tx
          .insert(clienteVehiculos)
          .values(vehiculoIds.map((vehiculoId) => ({ clienteId, vehiculoId })));
      }
    });
  }

  private choferToDomain(row: typeof choferes.$inferSelect): Chofer {
    return {
      id: row.id,
      empresaId: row.empresaId,
      transportistaId: row.transportistaId,
      nombre: row.nombre,
      apellido: row.apellido,
      cuit: row.cuit,
      dni: row.dni,
      telefono: row.telefono,
      licenciaVencimiento: row.licenciaVencimiento,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private vehiculoToDomain(row: typeof vehiculos.$inferSelect): Vehiculo {
    return {
      id: row.id,
      empresaId: row.empresaId,
      transportistaId: row.transportistaId,
      tipo: row.tipo as TipoVehiculo,
      patente: row.patente,
      descripcion: row.descripcion,
      rtoVencimiento: row.rtoVencimiento,
      seguroVencimiento: row.seguroVencimiento,
      habilitacionAnimalesVencimiento: row.habilitacionAnimalesVencimiento,
      activo: row.activo,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
