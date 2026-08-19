import multer from "multer";
import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, ApiResponse, Code } from "@/shared/infra/http/api.responses";
import { ExpressAdapter } from "@/shared/infra/http/http-server";
import { RoleGroups } from "@/modules/users/domain/role-groups";
import { FichajeValidation } from "@/modules/personal/infra/http/fichaje.validation";
import { PrevisualizarImportacionFichajes } from "@/modules/personal/use-cases/fichaje/previsualizar-importacion-fichajes.use-case";
import { ConfirmarImportacionFichajes } from "@/modules/personal/use-cases/fichaje/confirmar-importacion-fichajes.use-case";
import { AgregarFichajeManual } from "@/modules/personal/use-cases/fichaje/agregar-fichaje-manual.use-case";
import { AliasDispositivoConfirmar, FilaFichajeConfirmar } from "@/modules/personal/domain/fichaje-import";
import { TipoFichaje } from "@/modules/personal/domain/fichaje";

// Mismo criterio que `EmpleadoController` (subida de DNI): en memoria, sin
// paso intermedio a disco — acá ni siquiera se persiste el archivo, solo se
// parsea y se descarta.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** Importación de fichajes desde el Excel del lector de huellas — flujo en dos pasos (preview → confirmar). */
@injectable()
export class FichajeController {
  constructor(
    @inject(DI_TYPES.HttpServer) private readonly httpServer: ExpressAdapter,
    @inject(DI_TYPES.FichajeValidation) private readonly validation: FichajeValidation,
    @inject(DI_TYPES.PrevisualizarImportacionFichajes)
    private readonly previsualizarImportacionFichajes: PrevisualizarImportacionFichajes,
    @inject(DI_TYPES.ConfirmarImportacionFichajes)
    private readonly confirmarImportacionFichajes: ConfirmarImportacionFichajes,
    @inject(DI_TYPES.AgregarFichajeManual) private readonly agregarFichajeManual: AgregarFichajeManual,
  ) {
    this.registerRoutes();
  }

  private registerRoutes(): void {
    this.httpServer.register({
      method: "post",
      url: "/personal/fichajes/importar/preview",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      middlewares: [upload.single("archivo")],
      validation: this.validation.previsualizar,
      handler: async ({ auth, file }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        if (!file) throw new ApiError("Falta el archivo (campo 'archivo')", Code.BAD_REQUEST);
        const data = await this.previsualizarImportacionFichajes.execute({
          empresaId: auth.empresaId,
          buffer: file.buffer,
        });
        return new ApiResponse({ data, message: "Archivo procesado correctamente", status: Code.OK });
      },
    });

    this.httpServer.register({
      method: "post",
      url: "/personal/fichajes/importar/confirmar",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.confirmar,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { filas, alias } = body as {
          filas: FilaFichajeConfirmar[];
          alias?: AliasDispositivoConfirmar[];
        };
        const data = await this.confirmarImportacionFichajes.execute({
          empresaId: auth.empresaId,
          filas,
          alias,
        });
        return new ApiResponse({ data, message: "Fichajes importados correctamente", status: Code.OK });
      },
    });

    // Completar una marcación olvidada desde la vista de asistencia (ver
    // `docs/plan-personal-asistencia.md`, punto 7) — queda con origen "manual".
    this.httpServer.register({
      method: "post",
      url: "/personal/fichajes/manual",
      auth: "jwt-empresa",
      roles: RoleGroups.AdminAndContable,
      validation: this.validation.manual,
      handler: async ({ body, auth }) => {
        if (!auth?.empresaId) throw new ApiError("Unauthorized", Code.UNAUTHORIZED);
        const { empleadoId, momento, tipo } = body as { empleadoId: string; momento: Date; tipo: TipoFichaje };
        const data = await this.agregarFichajeManual.execute({
          empresaId: auth.empresaId,
          empleadoId,
          momento,
          tipo,
        });
        return new ApiResponse({ data, message: "Fichaje agregado correctamente", status: Code.CREATED });
      },
    });
  }
}
