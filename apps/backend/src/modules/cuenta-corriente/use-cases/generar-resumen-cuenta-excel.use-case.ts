import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ObtenerResumenCuentaData } from "@/modules/cuenta-corriente/use-cases/obtener-resumen-cuenta-data.use-case";
import { ResumenCuentaExcelGenerator } from "@/shared/infra/documents/resumen-cuenta-excel.generator";

export interface GenerarResumenCuentaExcelInput {
  clienteId: string;
  empresaId: string;
}

export interface ResumenCuentaExcelResult {
  buffer: Buffer;
  filename: string;
}

/** Arma el Excel del resumen de cuenta a partir de `ObtenerResumenCuentaData`. */
@injectable()
export class GenerarResumenCuentaExcel {
  constructor(
    @inject(DI_TYPES.ObtenerResumenCuentaData) private readonly obtenerResumenCuentaData: ObtenerResumenCuentaData,
    @inject(DI_TYPES.ResumenCuentaExcelGenerator)
    private readonly resumenCuentaExcelGenerator: ResumenCuentaExcelGenerator,
  ) {}

  async execute(input: GenerarResumenCuentaExcelInput): Promise<ResumenCuentaExcelResult> {
    const data = await this.obtenerResumenCuentaData.execute(input);
    const buffer = await this.resumenCuentaExcelGenerator.generate(data);
    const filename = `resumen-cuenta-${data.cliente.id.slice(0, 8)}.xlsx`;
    return { buffer, filename };
  }
}
