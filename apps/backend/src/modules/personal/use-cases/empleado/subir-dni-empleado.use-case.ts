import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { FileStorage } from "@/shared/infra/storage/file-storage";
import { Empleado } from "@/modules/personal/domain/empleado";
import { EmpleadoRepository } from "@/modules/personal/domain/empleado.repository";

const MIME_A_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export interface SubirDniEmpleadoInput {
  id: string;
  empresaId: string;
  buffer: Buffer;
  mimeType: string;
}

/**
 * Guarda la copia digitalizada del DNI de un empleado. Solo PDF/JPG/PNG — es
 * un documento de identidad, no cualquier archivo. Si ya tenía uno cargado,
 * el anterior se borra (no se acumulan versiones viejas sin usar disco).
 */
@injectable()
export class SubirDniEmpleado {
  constructor(
    @inject(DI_TYPES.EmpleadoRepository) private readonly empleadoRepository: EmpleadoRepository,
    @inject(DI_TYPES.FileStorage) private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: SubirDniEmpleadoInput): Promise<Empleado> {
    const extension = MIME_A_EXTENSION[input.mimeType];
    if (!extension) {
      throw new ApiError(
        "Formato no admitido — subí un PDF, JPG o PNG",
        Code.BAD_REQUEST,
      );
    }

    const empleado = await this.empleadoRepository.getById(input.id, input.empresaId);
    if (!empleado) throw new ApiError("Empleado no encontrado", Code.NOT_FOUND);

    const filename = `${input.id}-${Date.now()}.${extension}`;
    const relativePath = await this.fileStorage.save(
      input.buffer,
      `dni/${input.empresaId}`,
      filename,
    );

    if (empleado.dniArchivoPath) {
      await this.fileStorage.delete(empleado.dniArchivoPath);
    }

    return this.empleadoRepository.setDniArchivoPath(input.id, input.empresaId, relativePath);
  }
}
