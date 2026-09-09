import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { GrupoTropasValidation } from "@/modules/grupos-tropas/infra/http/validation";
import { CrearGrupoTropas } from "@/modules/grupos-tropas/use-cases/crear-grupo-tropas.use-case";
import { ListGruposTropas } from "@/modules/grupos-tropas/use-cases/list-grupos-tropas.use-case";
import { GetGrupoTropas } from "@/modules/grupos-tropas/use-cases/get-grupo-tropas.use-case";
import { CerrarGrupoTropas } from "@/modules/grupos-tropas/use-cases/cerrar-grupo-tropas.use-case";
import { ReabrirGrupoTropas } from "@/modules/grupos-tropas/use-cases/reabrir-grupo-tropas.use-case";

@injectable()
export class GrupoTropasController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.GrupoTropasValidation) private readonly validation: GrupoTropasValidation,
    @inject(DI_TYPES.CrearGrupoTropas) private readonly crearGrupoTropas: CrearGrupoTropas,
    @inject(DI_TYPES.ListGruposTropas) private readonly listGruposTropas: ListGruposTropas,
    @inject(DI_TYPES.GetGrupoTropas) private readonly getGrupoTropas: GetGrupoTropas,
    @inject(DI_TYPES.CerrarGrupoTropas) private readonly cerrarGrupoTropas: CerrarGrupoTropas,
    @inject(DI_TYPES.ReabrirGrupoTropas) private readonly reabrirGrupoTropas: ReabrirGrupoTropas,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // Admin + contable: armar un grupo es una decisión administrativa (reparte peso, dispara asientos).
    this.httpServer.register({
      method: "post",
      url: "/grupos-tropas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.crear,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { compraIds, pesoBrutoTotal, nombre, comentarios } = body as {
          compraIds: string[];
          pesoBrutoTotal: number;
          nombre?: string;
          comentarios?: string;
        };
        const data = await this.crearGrupoTropas.execute({
          empresaId: auth.empresaId,
          compraIds,
          pesoBrutoTotal,
          nombre,
          comentarios,
        });
        return new ApiResponse({ data, message: "Grupo de tropas creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/grupos-tropas",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listGruposTropas.execute({ empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Grupos de tropas obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/grupos-tropas/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getGrupoTropas.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Grupo de tropas obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/grupos-tropas/:id/cerrar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.cerrar,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.cerrarGrupoTropas.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Grupo de tropas cerrado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/grupos-tropas/:id/reabrir",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.reabrir,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.reabrirGrupoTropas.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Grupo de tropas reabierto correctamente", status: Code.OK });
      },
    });
  }
}
