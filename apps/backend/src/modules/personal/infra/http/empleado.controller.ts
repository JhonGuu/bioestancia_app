import multer from "multer";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code, FileResponse } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { EmpleadoValidation } from "@/modules/personal/infra/http/empleado.validation";
import { CreateEmpleado } from "@/modules/personal/use-cases/empleado/create-empleado.use-case";
import { ListEmpleados } from "@/modules/personal/use-cases/empleado/list-empleados.use-case";
import { GetEmpleado } from "@/modules/personal/use-cases/empleado/get-empleado.use-case";
import { UpdateEmpleado } from "@/modules/personal/use-cases/empleado/update-empleado.use-case";
import { DeleteEmpleado } from "@/modules/personal/use-cases/empleado/delete-empleado.use-case";
import { ReactivarEmpleado } from "@/modules/personal/use-cases/empleado/reactivar-empleado.use-case";
import { SubirDniEmpleado } from "@/modules/personal/use-cases/empleado/subir-dni-empleado.use-case";
import { DescargarDniEmpleado } from "@/modules/personal/use-cases/empleado/descargar-dni-empleado.use-case";
import { ListHorariosEmpleado } from "@/modules/personal/use-cases/horario-empleado/list-horarios-empleado.use-case";
import { SetHorariosEmpleado } from "@/modules/personal/use-cases/horario-empleado/set-horarios-empleado.use-case";
import { CreateEmpleadoInput, UpdateEmpleadoInput } from "@/modules/personal/domain/empleado.repository";
import { SetHorarioInput } from "@/modules/personal/domain/horario-empleado.repository";

// En memoria (no en disco temporal): son archivos chicos (copia de DNI) y el
// `FileStorage` ya se encarga de la persistencia final — no hace falta un
// paso intermedio. 10MB de tope, de sobra para un PDF/foto escaneados.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** CRUD de Empleados + horario semanal + copia de DNI. */
@injectable()
export class EmpleadoController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.EmpleadoValidation) private readonly validation: EmpleadoValidation,
    @inject(DI_TYPES.CreateEmpleado) private readonly createEmpleado: CreateEmpleado,
    @inject(DI_TYPES.ListEmpleados) private readonly listEmpleados: ListEmpleados,
    @inject(DI_TYPES.GetEmpleado) private readonly getEmpleado: GetEmpleado,
    @inject(DI_TYPES.UpdateEmpleado) private readonly updateEmpleado: UpdateEmpleado,
    @inject(DI_TYPES.DeleteEmpleado) private readonly deleteEmpleado: DeleteEmpleado,
    @inject(DI_TYPES.ReactivarEmpleado) private readonly reactivarEmpleado: ReactivarEmpleado,
    @inject(DI_TYPES.SubirDniEmpleado) private readonly subirDniEmpleado: SubirDniEmpleado,
    @inject(DI_TYPES.DescargarDniEmpleado) private readonly descargarDniEmpleado: DescargarDniEmpleado,
    @inject(DI_TYPES.ListHorariosEmpleado) private readonly listHorariosEmpleado: ListHorariosEmpleado,
    @inject(DI_TYPES.SetHorariosEmpleado) private readonly setHorariosEmpleado: SetHorariosEmpleado,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "post",
      url: "/personal/empleados",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.create,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as Omit<CreateEmpleadoInput, "empresaId">;
        const data = await this.createEmpleado.execute({ ...input, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Empleado creado correctamente", status: Code.CREATED });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/personal/empleados",
      auth: "jwt-empresa",
      validation: this.validation.list,
      handler: async ({ query, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { estado } = query as unknown as { estado?: "activos" | "inactivos" | "todos" };
        const data = await this.listEmpleados.execute({ empresaId: auth.empresaId, estado });
        return new ApiResponse({ data, message: "Empleados obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/personal/empleados/:id",
      auth: "jwt-empresa",
      validation: this.validation.getById,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.getEmpleado.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Empleado obtenido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "patch",
      url: "/personal/empleados/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.update,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const input = body as UpdateEmpleadoInput;
        const data = await this.updateEmpleado.execute({ ...input, id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Empleado actualizado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "delete",
      url: "/personal/empleados/:id",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.delete,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        await this.deleteEmpleado.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ message: "Empleado eliminado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/personal/empleados/:id/reactivar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.reactivar,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.reactivarEmpleado.execute({ id: params.id, empresaId: auth.empresaId });
        return new ApiResponse({ data, message: "Empleado reactivado correctamente", status: Code.OK });
      },
    });

    // Horario semanal pactado — reemplazo completo (ver `SetHorariosEmpleado`).
    this.httpServer.register({
      method: "get",
      url: "/personal/empleados/:id/horarios",
      auth: "jwt-empresa",
      validation: this.validation.getHorarios,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const data = await this.listHorariosEmpleado.execute({
          empleadoId: params.id,
          empresaId: auth.empresaId,
        });
        return new ApiResponse({ data, message: "Horarios obtenidos correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "put",
      url: "/personal/empleados/:id/horarios",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.setHorarios,
      handler: async ({ params, body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { horarios } = body as { horarios: SetHorarioInput[] };
        const data = await this.setHorariosEmpleado.execute({
          empleadoId: params.id,
          empresaId: auth.empresaId,
          horarios,
        });
        return new ApiResponse({ data, message: "Horario actualizado correctamente", status: Code.OK });
      },
    });

    // Copia digitalizada del DNI — subida (multipart) y descarga, ambas
    // autenticadas. Nunca se sirve por una ruta pública/estática.
    this.httpServer.register({
      method: "post",
      url: "/personal/empleados/:id/dni",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      middlewares: [upload.single("archivo")],
      validation: this.validation.dniParams,
      handler: async ({ params, auth, file }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        if (!file) throw new ApiError("Falta el archivo (campo 'archivo')", Code.BAD_REQUEST);
        const data = await this.subirDniEmpleado.execute({
          id: params.id,
          empresaId: auth.empresaId,
          buffer: file.buffer,
          mimeType: file.mimetype,
        });
        return new ApiResponse({ data, message: "Documento subido correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "get",
      url: "/personal/empleados/:id/dni",
      auth: "jwt-empresa",
      validation: this.validation.dniParams,
      handler: async ({ params, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { buffer, extension } = await this.descargarDniEmpleado.execute({
          id: params.id,
          empresaId: auth.empresaId,
        });
        const contentType =
          extension === "pdf" ? "application/pdf" : extension === "png" ? "image/png" : "image/jpeg";
        return new FileResponse(buffer, `dni.${extension}`, contentType, "inline");
      },
    });
  }
}
