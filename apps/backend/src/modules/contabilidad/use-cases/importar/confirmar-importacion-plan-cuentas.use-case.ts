import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CreateCuentaInput, CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import {
  CuentaAImportar,
  FilaPlanCuentasCruda,
  ResultadoImportacionPlanCuentas,
} from "@/modules/contabilidad/domain/importacion-plan-cuentas";
import { resolverImportacionPlanCuentas } from "@/modules/contabilidad/domain/resolver-importacion-plan-cuentas";

export interface ConfirmarImportacionPlanCuentasInput {
  empresaId: string;
  /** Las filas que la previsualización marcó como `aCrear` (el usuario ya las revisó). */
  filas: CuentaAImportar[];
}

/**
 * Segundo paso: recibe las filas que la previsualización resolvió sin
 * error y las crea, nivel por nivel (igual que `SembrarPlanCuentas`).
 *
 * Vuelve a correr `resolverImportacionPlanCuentas` contra el estado ACTUAL
 * de la base en vez de confiar ciegamente en lo que mandó el cliente —
 * cubre el caso de que algo haya cambiado entre la previsualización y la
 * confirmación (otra persona cargó una cuenta con el mismo código, por
 * ejemplo). Nunca duplica: los códigos que ya existen se saltean solos.
 */
@injectable()
export class ConfirmarImportacionPlanCuentas {
  constructor(@inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository) {}

  async execute(input: ConfirmarImportacionPlanCuentasInput): Promise<ResultadoImportacionPlanCuentas> {
    if (input.filas.length === 0) return { creadas: 0, omitidas: 0 };

    const existentes = await this.cuentaRepository.list(input.empresaId, true);

    const filasCrudas: FilaPlanCuentasCruda[] = input.filas.map((f) => ({
      fila: f.fila,
      codigo: f.codigo,
      nombre: f.nombre,
      tipo: f.tipo,
      tipoTexto: f.tipo,
      codigoPadre: f.codigoPadre,
      imputable: f.imputable,
      monetaria: f.monetaria,
      requiereAuxiliar: f.requiereAuxiliar,
    }));

    const { aCrear, porNivel } = resolverImportacionPlanCuentas(filasCrudas, existentes);
    const omitidas = input.filas.length - aCrear.length;

    const idsPorCodigo = new Map(existentes.map((c) => [c.codigo, c.id]));
    let creadas = 0;

    for (const nivel of [...porNivel.keys()].sort((a, b) => a - b)) {
      const delNivel = porNivel.get(nivel) ?? [];
      const inputs: CreateCuentaInput[] = delNivel.map((cuenta) => ({
        empresaId: input.empresaId,
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        parentId: cuenta.codigoPadre ? (idsPorCodigo.get(cuenta.codigoPadre) ?? null) : null,
        imputable: cuenta.imputable,
        monetaria: cuenta.monetaria,
        requiereAuxiliar: cuenta.requiereAuxiliar,
      }));

      const creadasDelNivel = await this.cuentaRepository.createMany(inputs);
      for (const cuenta of creadasDelNivel) idsPorCodigo.set(cuenta.codigo, cuenta.id);
      creadas += creadasDelNivel.length;
    }

    return { creadas, omitidas };
  }
}
