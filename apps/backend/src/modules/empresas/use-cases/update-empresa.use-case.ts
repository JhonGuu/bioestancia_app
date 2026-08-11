import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Empresa } from "@/modules/empresas/domain/empresa";
import { EmpresaRepository, UpdateEmpresaInput } from "@/modules/empresas/domain/empresa.repository";

/**
 * Actualiza los datos de contacto/fiscales de una empresa (cuit, teléfono,
 * dirección) — hoy sobre todo para completar los que se muestran en el
 * encabezado del PDF de boleta (ver `BoletaPdfGenerator`). No toca
 * `razonSocial`/`rubro`: son estructurales, no se editan por acá.
 */
@injectable()
export class UpdateEmpresa {
  constructor(
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
  ) {}

  async execute(id: string, input: UpdateEmpresaInput): Promise<Empresa> {
    return this.empresaRepository.update(id, input);
  }
}
