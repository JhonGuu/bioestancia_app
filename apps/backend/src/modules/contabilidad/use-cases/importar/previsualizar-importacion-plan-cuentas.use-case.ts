import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import {
  FilaPlanCuentasCruda,
  PreviewImportacionPlanCuentas,
} from "@/modules/contabilidad/domain/importacion-plan-cuentas";
import { resolverImportacionPlanCuentas } from "@/modules/contabilidad/domain/resolver-importacion-plan-cuentas";
import { celdaATexto, leerFilasExcel, mapearTexto, parsearBooleano } from "@/modules/contabilidad/infra/import/excel-reader.util";

export interface PrevisualizarImportacionPlanCuentasInput {
  empresaId: string;
  buffer: Buffer;
}

const TIPOS_CUENTA_TEXTOS: Record<string, TipoCuenta> = {
  activo: TipoCuenta.ACTIVO,
  pasivo: TipoCuenta.PASIVO,
  patrimonioneto: TipoCuenta.PATRIMONIO_NETO,
  pn: TipoCuenta.PATRIMONIO_NETO,
  resultadopositivo: TipoCuenta.RESULTADO_POSITIVO,
  ingreso: TipoCuenta.RESULTADO_POSITIVO,
  ingresos: TipoCuenta.RESULTADO_POSITIVO,
  resultadonegativo: TipoCuenta.RESULTADO_NEGATIVO,
  gasto: TipoCuenta.RESULTADO_NEGATIVO,
  gastos: TipoCuenta.RESULTADO_NEGATIVO,
  orden: TipoCuenta.ORDEN,
};

const AUXILIARES_TEXTOS: Record<string, TipoAuxiliar> = {
  "": TipoAuxiliar.NINGUNO,
  ninguno: TipoAuxiliar.NINGUNO,
  cliente: TipoAuxiliar.CLIENTE,
  proveedor: TipoAuxiliar.PROVEEDOR,
  empleado: TipoAuxiliar.EMPLEADO,
  frigorifico: TipoAuxiliar.FRIGORIFICO,
  cuentadefondos: TipoAuxiliar.CUENTA_FONDOS,
  cuentafondos: TipoAuxiliar.CUENTA_FONDOS,
  cheque: TipoAuxiliar.CHEQUE,
};

/**
 * Primer paso de la importación del plan de cuentas: parsea el Excel,
 * interpreta cada fila y la resuelve contra el plan ya existente
 * (`resolverImportacionPlanCuentas`). No escribe nada en la base.
 *
 * Columnas del Excel (ver plantilla descargable): Codigo, Nombre, Tipo,
 * CodigoPadre (opcional), Imputable (opcional, default sí), Monetaria
 * (opcional, default no), Auxiliar (opcional, default ninguno).
 */
@injectable()
export class PrevisualizarImportacionPlanCuentas {
  constructor(@inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository) {}

  async execute(input: PrevisualizarImportacionPlanCuentasInput): Promise<PreviewImportacionPlanCuentas> {
    const { filas } = leerFilasExcel(input.buffer, {
      codigo: { candidatos: ["codigo"], requerida: true },
      nombre: { candidatos: ["nombre"], requerida: true },
      tipo: { candidatos: ["tipo", "tipodecuenta"], requerida: true },
      codigoPadre: { candidatos: ["codigopadre", "padre", "cuentapadre"] },
      imputable: { candidatos: ["imputable"] },
      monetaria: { candidatos: ["monetaria"] },
      requiereAuxiliar: { candidatos: ["auxiliar", "requiereauxiliar"] },
    });

    const filasCrudas: FilaPlanCuentasCruda[] = filas.map((fila) => {
      const tipoTexto = celdaATexto(fila.valores.tipo);
      const imputableCruda = fila.valores.imputable;
      return {
        fila: fila.numero,
        codigo: celdaATexto(fila.valores.codigo),
        nombre: celdaATexto(fila.valores.nombre),
        tipo: mapearTexto(tipoTexto, TIPOS_CUENTA_TEXTOS),
        tipoTexto,
        codigoPadre: celdaATexto(fila.valores.codigoPadre) || null,
        // Sin columna o vacía => imputable por defecto (la mayoría de las filas de un plan son de imputación).
        imputable: imputableCruda === undefined || celdaATexto(imputableCruda) === "" ? true : parsearBooleano(imputableCruda),
        monetaria: parsearBooleano(fila.valores.monetaria),
        requiereAuxiliar: mapearTexto(celdaATexto(fila.valores.requiereAuxiliar), AUXILIARES_TEXTOS) ?? TipoAuxiliar.NINGUNO,
      };
    });

    const existentes = await this.cuentaRepository.list(input.empresaId, true);
    const { aCrear, yaExistentes, conError } = resolverImportacionPlanCuentas(filasCrudas, existentes);

    return {
      totalFilas: filas.length,
      aCrear: aCrear.sort((a, b) => a.codigo.localeCompare(b.codigo, "es", { numeric: true })),
      yaExistentes,
      conError,
    };
  }
}
