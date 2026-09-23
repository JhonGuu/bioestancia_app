import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { Permisos } from "@/modules/permisos/domain/permiso";
import { TransporteValidation } from "@/modules/transportes/infra/http/validation";
import { ocultarDatosPersonales } from "@/modules/transportes/domain/chofer-privacidad";
import { Chofer } from "@/modules/transportes/domain/chofer";
import { EstadoTransporteFiltro } from "@/modules/transportes/domain/estado-filtro";
import { UpdateTransportistaInput } from "@/modules/transportes/domain/transportista.repository";
import { CreateChoferInput, UpdateChoferInput } from "@/modules/transportes/domain/chofer.repository";
import { CreateVehiculoInput, UpdateVehiculoInput } from "@/modules/transportes/domain/vehiculo.repository";
import {
  CreateTransportista,
  DeleteTransportista,
  GetTransportista,
  ListTransportistas,
  ReactivarTransportista,
  UpdateTransportista,
} from "@/modules/transportes/use-cases/transportista.use-cases";
import {
  CreateChofer,
  DeleteChofer,
  GetChofer,
  ListChoferes,
  ReactivarChofer,
  UpdateChofer,
} from "@/modules/transportes/use-cases/chofer.use-cases";
import {
  CreateVehiculo,
  DeleteVehiculo,
  GetVehiculo,
  ListVehiculos,
  ReactivarVehiculo,
  UpdateVehiculo,
} from "@/modules/transportes/use-cases/vehiculo.use-cases";
import {
  GetTransporteCliente,
  SetTransporteCliente,
} from "@/modules/transportes/use-cases/transporte-cliente.use-cases";

interface AuthContext {
  empresaId?: string;
  permisos?: string[];
}

/**
 * Directorio de transporte de la empresa activa: transportistas, choferes y
 * vehículos, más las listas de choferes y vehículos autorizados por cliente.
 *
 * Alta, edición, baja y reactivación: admin o contable. Lectura: cualquier
 * usuario de la empresa, salvo el DNI y la licencia de los choferes, que solo
 * ve quien tiene el permiso `VER_DATOS_CHOFERES`.
 */
@injectable()
export class TransporteController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.TransporteValidation) private readonly validation: TransporteValidation,
    @inject(DI_TYPES.CreateTransportista) private readonly createTransportista: CreateTransportista,
    @inject(DI_TYPES.ListTransportistas) private readonly listTransportistas: ListTransportistas,
    @inject(DI_TYPES.GetTransportista) private readonly getTransportista: GetTransportista,
    @inject(DI_TYPES.UpdateTransportista) private readonly updateTransportista: UpdateTransportista,
    @inject(DI_TYPES.DeleteTransportista) private readonly deleteTransportista: DeleteTransportista,
    @inject(DI_TYPES.ReactivarTransportista)
    private readonly reactivarTransportista: ReactivarTransportista,
    @inject(DI_TYPES.CreateChofer) private readonly createChofer: CreateChofer,
    @inject(DI_TYPES.ListChoferes) private readonly listChoferes: ListChoferes,
    @inject(DI_TYPES.GetChofer) private readonly getChofer: GetChofer,
    @inject(DI_TYPES.UpdateChofer) private readonly updateChofer: UpdateChofer,
    @inject(DI_TYPES.DeleteChofer) private readonly deleteChofer: DeleteChofer,
    @inject(DI_TYPES.ReactivarChofer) private readonly reactivarChofer: ReactivarChofer,
    @inject(DI_TYPES.CreateVehiculo) private readonly createVehiculo: CreateVehiculo,
    @inject(DI_TYPES.ListVehiculos) private readonly listVehiculos: ListVehiculos,
    @inject(DI_TYPES.GetVehiculo) private readonly getVehiculo: GetVehiculo,
    @inject(DI_TYPES.UpdateVehiculo) private readonly updateVehiculo: UpdateVehiculo,
    @inject(DI_TYPES.DeleteVehiculo) private readonly deleteVehiculo: DeleteVehiculo,
    @inject(DI_TYPES.ReactivarVehiculo) private readonly reactivarVehiculo: ReactivarVehiculo,
    @inject(DI_TYPES.GetTransporteCliente) private readonly getTransporteCliente: GetTransporteCliente,
    @inject(DI_TYPES.SetTransporteCliente) private readonly setTransporteCliente: SetTransporteCliente,
  ) {
    this.registerTransportistas();
    this.registerChoferes();
    this.registerVehiculos();
    this.registerTransporteCliente();
  }

  private empresaId(auth: AuthContext | undefined): string {
    if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
    return auth.empresaId;
  }

  private puedeVerDatosChoferes(auth: AuthContext | undefined): boolean {
    return auth?.permisos?.includes(Permisos.VER_DATOS_CHOFERES) ?? false;
  }

  private visible(chofer: Chofer, auth: AuthContext | undefined): Chofer {
    return this.puedeVerDatosChoferes(auth) ? chofer : ocultarDatosPersonales(chofer);
  }

  private registerTransportistas(): void {
    const v = this.validation;

    this.httpServer.register({
      method: "post",
      url: "/transportistas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.transportista.create,
      handler: async ({ body, auth }) => {
        const data = await this.createTransportista.execute({
          ...(body as UpdateTransportistaInput),
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Transportista creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/transportistas",
      auth: "jwt-empresa",
      validation: v.list,
      handler: async ({ query, auth }) => {
        const { estado } = query as unknown as { estado?: EstadoTransporteFiltro };
        const data = await this.listTransportistas.execute({ empresaId: this.empresaId(auth), estado });
        return new ApiResponse({ data, message: "Transportistas obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/transportistas/:id",
      auth: "jwt-empresa",
      validation: v.byId,
      handler: async ({ params, auth }) => {
        const data = await this.getTransportista.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({ data, message: "Transportista obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/transportistas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.transportista.update,
      handler: async ({ params, body, auth }) => {
        const data = await this.updateTransportista.execute({
          ...(body as UpdateTransportistaInput),
          id: params.id,
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Transportista actualizado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/transportistas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.byId,
      handler: async ({ params, auth }) => {
        await this.deleteTransportista.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({ message: "Transportista dado de baja correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/transportistas/:id/reactivar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.byId,
      handler: async ({ params, auth }) => {
        const data = await this.reactivarTransportista.execute({
          id: params.id,
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Transportista reactivado correctamente", status: Code.OK });
      },
    });
  }

  private registerChoferes(): void {
    const v = this.validation;

    this.httpServer.register({
      method: "post",
      url: "/choferes",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.chofer.create,
      handler: async ({ body, auth }) => {
        const data = await this.createChofer.execute({
          ...(body as UpdateChoferInput),
          empresaId: this.empresaId(auth),
        } satisfies CreateChoferInput);
        return new ApiResponse({
          data: this.visible(data, auth),
          message: "Chofer creado correctamente",
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/choferes",
      auth: "jwt-empresa",
      validation: v.list,
      handler: async ({ query, auth }) => {
        const { estado } = query as unknown as { estado?: EstadoTransporteFiltro };
        const data = await this.listChoferes.execute({ empresaId: this.empresaId(auth), estado });
        return new ApiResponse({
          data: data.map((chofer) => this.visible(chofer, auth)),
          message: "Choferes obtenidos correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/choferes/:id",
      auth: "jwt-empresa",
      validation: v.byId,
      handler: async ({ params, auth }) => {
        const data = await this.getChofer.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({
          data: this.visible(data, auth),
          message: "Chofer obtenido correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/choferes/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.chofer.update,
      handler: async ({ params, body, auth }) => {
        const data = await this.updateChofer.execute({
          ...(body as UpdateChoferInput),
          id: params.id,
          empresaId: this.empresaId(auth),
          puedeVerDatosPersonales: this.puedeVerDatosChoferes(auth),
        });
        return new ApiResponse({
          data: this.visible(data, auth),
          message: "Chofer actualizado correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/choferes/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.byId,
      handler: async ({ params, auth }) => {
        await this.deleteChofer.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({ message: "Chofer dado de baja correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/choferes/:id/reactivar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.byId,
      handler: async ({ params, auth }) => {
        const data = await this.reactivarChofer.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({
          data: this.visible(data, auth),
          message: "Chofer reactivado correctamente",
          status: Code.OK,
        });
      },
    });
  }

  private registerVehiculos(): void {
    const v = this.validation;

    this.httpServer.register({
      method: "post",
      url: "/vehiculos",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.vehiculo.create,
      handler: async ({ body, auth }) => {
        const data = await this.createVehiculo.execute({
          ...(body as UpdateVehiculoInput),
          empresaId: this.empresaId(auth),
        } satisfies CreateVehiculoInput);
        return new ApiResponse({ data, message: "Vehículo creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/vehiculos",
      auth: "jwt-empresa",
      validation: v.list,
      handler: async ({ query, auth }) => {
        const { estado } = query as unknown as { estado?: EstadoTransporteFiltro };
        const data = await this.listVehiculos.execute({ empresaId: this.empresaId(auth), estado });
        return new ApiResponse({ data, message: "Vehículos obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/vehiculos/:id",
      auth: "jwt-empresa",
      validation: v.byId,
      handler: async ({ params, auth }) => {
        const data = await this.getVehiculo.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({ data, message: "Vehículo obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/vehiculos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.vehiculo.update,
      handler: async ({ params, body, auth }) => {
        const data = await this.updateVehiculo.execute({
          ...(body as UpdateVehiculoInput),
          id: params.id,
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({ data, message: "Vehículo actualizado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/vehiculos/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.byId,
      handler: async ({ params, auth }) => {
        await this.deleteVehiculo.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({ message: "Vehículo dado de baja correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/vehiculos/:id/reactivar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.byId,
      handler: async ({ params, auth }) => {
        const data = await this.reactivarVehiculo.execute({ id: params.id, empresaId: this.empresaId(auth) });
        return new ApiResponse({ data, message: "Vehículo reactivado correctamente", status: Code.OK });
      },
    });
  }

  private registerTransporteCliente(): void {
    const v = this.validation;

    this.httpServer.register({
      method: "get",
      url: "/clientes/:id/transporte",
      auth: "jwt-empresa",
      validation: v.transporteCliente.get,
      handler: async ({ params, auth }) => {
        const data = await this.getTransporteCliente.execute({
          clienteId: params.id,
          empresaId: this.empresaId(auth),
        });
        return new ApiResponse({
          data: { ...data, choferes: data.choferes.map((chofer) => this.visible(chofer, auth)) },
          message: "Transporte del cliente obtenido correctamente",
          status: Code.OK,
        });
      },
    });

    this.httpServer.register({
      method: "put",
      url: "/clientes/:id/transporte",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: v.transporteCliente.set,
      handler: async ({ params, body, auth }) => {
        const { choferIds, vehiculoIds } = body as { choferIds: string[]; vehiculoIds: string[] };
        const data = await this.setTransporteCliente.execute({
          clienteId: params.id,
          empresaId: this.empresaId(auth),
          choferIds,
          vehiculoIds,
        });
        return new ApiResponse({
          data: { ...data, choferes: data.choferes.map((chofer) => this.visible(chofer, auth)) },
          message: "Transporte del cliente actualizado correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
