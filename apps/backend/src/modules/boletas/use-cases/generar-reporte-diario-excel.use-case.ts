import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ObtenerReporteDiarioData } from "@/modules/boletas/use-cases/obtener-reporte-diario-data.use-case";
import { ReporteDiarioExcelGenerator } from "@/shared/infra/documents/reporte-diario-excel.generator";

export interface GenerarReporteDiarioExcelInput {
  empresaId: string;
  fecha: Date;
}

export interface ReporteDiarioExcelResult {
  buffer: Buffer;
  filename: string;
}

/** Arma el Excel del reporte diario a partir de `ObtenerReporteDiarioData`. */
@injectable()
export class GenerarReporteDiarioExcel {
  constructor(
    @inject(DI_TYPES.ObtenerReporteDiarioData) private readonly obtenerReporteDiarioData: ObtenerReporteDiarioData,
    @inject(DI_TYPES.ReporteDiarioExcelGenerator)
    private readonly reporteDiarioExcelGenerator: ReporteDiarioExcelGenerator,
  ) {}

  async execute(input: GenerarReporteDiarioExcelInput): Promise<ReporteDiarioExcelResult> {
    const data = await this.obtenerReporteDiarioData.execute(input);
    const buffer = await this.reporteDiarioExcelGenerator.generate(data);
    const filename = `reporte-diario-${input.fecha.toISOString().slice(0, 10)}.xlsx`;
    return { buffer, filename };
  }
}
