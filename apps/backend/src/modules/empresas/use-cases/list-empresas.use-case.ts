import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Empresa } from "@/modules/empresas/domain/empresa";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";

/**
 * Lista TODAS las empresas activas del sistema (sin filtrar por acceso).
 * Uso administrativo — a diferencia de `GetMyEmpresas` (módulo users), que
 * devuelve solo las empresas a las que el usuario autenticado tiene acceso.
 */
@injectable()
export class ListEmpresas {
  constructor(
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
  ) {}

  async execute(): Promise<Empresa[]> {
    return this.empresaRepository.list();
  }
}
