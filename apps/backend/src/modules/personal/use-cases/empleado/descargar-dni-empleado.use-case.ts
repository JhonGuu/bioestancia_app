import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { FileStorage } from "@/shared/infra/storage/file-storage";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

export interface DescargarDniEmpleadoInput {
  id: string;
  empresaId: string;
}

export interface DescargarDniEmpleadoOutput {
  buffer: Buffer;
  extension: string;
}

/** Sirve la copia del DNI vía un endpoint autenticado — nunca una URL pública directa. */
@injectable()
export class DescargarDniEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
    @inject(DI_TYPES.FileStorage) private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: DescargarDniEmpleadoInput): Promise<DescargarDniEmpleadoOutput> {
    const empleado = await this.empleadoRepository.getById(input.id, input.empresaId);
    if (!empleado?.dniArchivoPath) {
      throw new ApiError("Este empleado no tiene una copia de DNI cargada", Code.NOT_FOUND);
    }

    const buffer = await this.fileStorage.read(empleado.dniArchivoPath);
    if (!buffer) {
      throw new ApiError("El archivo no se encontró en el almacenamiento", Code.NOT_FOUND);
    }

    const extension = empleado.dniArchivoPath.split(".").pop() ?? "pdf";
    return { buffer, extension };
  }
}
