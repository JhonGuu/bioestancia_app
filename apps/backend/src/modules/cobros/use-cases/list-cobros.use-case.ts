import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PaginatedResult, PaginationQuery } from "@/shared/infra/http/pagination";
import { CobroConLineas, CobroRepository } from "@/modules/cobros/domain/cobro.repository";

export interface ListCobrosInput {
  empresaId: string;
  clienteId?: string;
  /** Si no viene, devuelve TODO (ver nota en `CobroRepository.list`) — hoy lo usan porcentaje-cobranza, informe-cobranzas y cuenta-corriente; no pasarlo desde una pantalla nueva. */
  pagination?: PaginationQuery;
}

@injectable()
export class ListCobros {
  constructor(@inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository) {}

  execute(input: ListCobrosInput & { pagination: PaginationQuery }): Promise<PaginatedResult<CobroConLineas>>;
  execute(input: ListCobrosInput): Promise<CobroConLineas[] | PaginatedResult<CobroConLineas>>;
  async execute(input: ListCobrosInput): Promise<CobroConLineas[] | PaginatedResult<CobroConLineas>> {
    if (input.pagination) {
      return this.cobroRepository.list(input.empresaId, input.clienteId, input.pagination);
    }
    return this.cobroRepository.list(input.empresaId, input.clienteId);
  }
}
