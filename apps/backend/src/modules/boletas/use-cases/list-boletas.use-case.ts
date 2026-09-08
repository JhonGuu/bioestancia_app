import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PaginatedResult, PaginationQuery } from "@/shared/infra/http/pagination";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";

export interface ListBoletasInput {
  empresaId: string;
  /** Si no viene, devuelve TODO (ver nota en `BoletaRepository.list`) — hoy lo usan porcentaje-cobranza y cuenta-corriente, que agregan sobre el total; no pasarlo desde una pantalla nueva. */
  pagination?: PaginationQuery;
}

@injectable()
export class ListBoletas {
  constructor(@inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository) {}

  execute(input: ListBoletasInput & { pagination: PaginationQuery }): Promise<PaginatedResult<Boleta>>;
  execute(input: ListBoletasInput): Promise<Boleta[] | PaginatedResult<Boleta>>;
  async execute(input: ListBoletasInput): Promise<Boleta[] | PaginatedResult<Boleta>> {
    if (input.pagination) {
      return this.boletaRepository.list(input.empresaId, input.pagination);
    }
    return this.boletaRepository.list(input.empresaId);
  }
}
