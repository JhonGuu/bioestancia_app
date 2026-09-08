import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { CentroCosto } from "@/modules/contabilidad/domain/centro-costo";
import {
  CentroCostoRepository,
  CreateCentroCostoInput,
  UpdateCentroCostoInput,
} from "@/modules/contabilidad/domain/centro-costo.repository";

@injectable()
export class ListarCentrosCosto {
  constructor(
    @inject(DI_TYPES.CentroCostoRepository) private readonly repository: CentroCostoRepository,
  ) {}

  async execute(empresaId: string, incluirInactivos = true): Promise<CentroCosto[]> {
    return this.repository.list(empresaId, incluirInactivos);
  }
}

@injectable()
export class CrearCentroCosto {
  constructor(
    @inject(DI_TYPES.CentroCostoRepository) private readonly repository: CentroCostoRepository,
  ) {}

  async execute(input: CreateCentroCostoInput): Promise<CentroCosto> {
    const existente = await this.repository.getByCodigo(input.codigo, input.empresaId);
    if (existente) {
      throw new ApiError(`Ya existe un centro de costo con el código ${input.codigo}`, Code.BAD_REQUEST);
    }
    return this.repository.create(input);
  }
}

@injectable()
export class ActualizarCentroCosto {
  constructor(
    @inject(DI_TYPES.CentroCostoRepository) private readonly repository: CentroCostoRepository,
  ) {}

  async execute(id: string, empresaId: string, input: UpdateCentroCostoInput): Promise<CentroCosto> {
    const centro = await this.repository.getById(id, empresaId);
    if (!centro) throw new ApiError("El centro de costo no existe", Code.NOT_FOUND);

    if (input.codigo && input.codigo !== centro.codigo) {
      const existente = await this.repository.getByCodigo(input.codigo, empresaId);
      if (existente) {
        throw new ApiError(`Ya existe un centro de costo con el código ${input.codigo}`, Code.BAD_REQUEST);
      }
    }

    return this.repository.update(id, empresaId, input);
  }
}

/** Igual que con las cuentas: si ya se usó, se desactiva en vez de borrarse. */
@injectable()
export class EliminarCentroCosto {
  constructor(
    @inject(DI_TYPES.CentroCostoRepository) private readonly repository: CentroCostoRepository,
  ) {}

  async execute(id: string, empresaId: string): Promise<{ eliminado: boolean; mensaje: string }> {
    const centro = await this.repository.getById(id, empresaId);
    if (!centro) throw new ApiError("El centro de costo no existe", Code.NOT_FOUND);

    if (await this.repository.tieneMovimientos(id)) {
      await this.repository.update(id, empresaId, { activo: false });
      return {
        eliminado: false,
        mensaje: `"${centro.nombre}" tiene movimientos imputados, así que se desactivó en vez de borrarse`,
      };
    }

    await this.repository.delete(id, empresaId);
    return { eliminado: true, mensaje: "Centro de costo eliminado correctamente" };
  }
}
