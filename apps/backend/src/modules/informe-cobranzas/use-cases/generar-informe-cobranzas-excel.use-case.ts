import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ObtenerInformeCobranzas, ObtenerInformeCobranzasInput } from "@/modules/informe-cobranzas/use-cases/obtener-informe-cobranzas.use-case";
import { InformeCobranzasExcelGenerator } from "@/shared/infra/documents/informe-cobranzas-excel.generator";

export interface InformeCobranzasExcelResult {
  buffer: Buffer;
  filename: string;
}

/** Arma el Excel del informe de cobranzas a partir de `ObtenerInformeCobranzas`. */
@injectable()
export class GenerarInformeCobranzasExcel {
  constructor(
    @inject(DI_TYPES.ObtenerInformeCobranzas) private readonly obtenerInformeCobranzas: ObtenerInformeCobranzas,
    @inject(DI_TYPES.InformeCobranzasExcelGenerator)
    private readonly informeCobranzasExcelGenerator: InformeCobranzasExcelGenerator,
  ) {}

  async execute(input: ObtenerInformeCobranzasInput): Promise<InformeCobranzasExcelResult> {
    const data = await this.obtenerInformeCobranzas.execute(input);
    const buffer = await this.informeCobranzasExcelGenerator.generate(data);
    const filename = `informe-cobranzas-${new Date().toISOString().slice(0, 10)}.xlsx`;
    return { buffer, filename };
  }
}
