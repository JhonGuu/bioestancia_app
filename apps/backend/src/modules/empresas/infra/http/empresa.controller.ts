import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { EmpresaValidation } from "@/modules/empresas/infra/http/validation";
import { CreateEmpresa, CreateEmpresaInput } from "@/modules/empresas/use-cases/create-empresa.use-case";
import { ListEmpresas } from "@/modules/empresas/use-cases/list-empresas.use-case";
import { UpdateEmpresa } from "@/modules/empresas/use-cases/update-empresa.use-case";
import { UpdateEmpresaInput } from "@/modules/empresas/domain/empresa.repository";

/**
 * Endpoints administrativos sobre empresas. En la práctica, con dos empresas
 * conocidas (Bioestancia, El Meridiano), esto se usa una vez al bootstrapear
 * el sistema (ver `pnpm db:seed`) — no es un CRUD de uso diario.
 *
 * Nota sobre `roles: RoleGroups.AdminOnly`: acá "admin" se resuelve sobre la
 * empresa activa (header `X-Empresa-Id`), no es un rol global. Cualquier admin
 * de cualquier empresa existente puede dar de alta una empresa nueva.
 */
@injectable()
export class EmpresaController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.EmpresaValidation) private readonly validation: EmpresaValidation,
    @inject(DI_TYPES.CreateEmpresa) private readonly createEmpresa: CreateEmpresa,
    @inject(DI_TYPES.ListEmpresas) private readonly listEmpresas: ListEmpresas,
    @inject(DI_TYPES.UpdateEmpresa) private readonly updateEmpresa: UpdateEmpresa,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "post",
      url: "/empresas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.create,
      handler: async ({ body }) => {
        const data = await this.createEmpresa.execute(body as CreateEmpresaInput);
        return new ApiResponse({
          data,
          message: "Empresa creada correctamente",
          status: Code.CREATED,
        });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/empresas",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      handler: async () => {
        const data = await this.listEmpresas.execute();
        return new ApiResponse({
          data,
          message: "Empresas obtenidas correctamente",
          status: Code.OK,
        });
      },
    });

    // Completar/editar cuit, teléfono, dirección — hoy sobre todo para que
    // aparezcan en el encabezado del PDF de boleta (ver `BoletaPdfGenerator`).
    this.httpServer.register({
      method: "patch",
      url: "/empresas/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminOnly,
      validation: this.validation.update,
      handler: async ({ params, body }) => {
        const data = await this.updateEmpresa.execute(params.id, body as UpdateEmpresaInput);
        return new ApiResponse({
          data,
          message: "Empresa actualizada correctamente",
          status: Code.OK,
        });
      },
    });
  }
}
