import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ObtenerReporteDiarioData } from "@/modules/boletas/use-cases/obtener-reporte-diario-data.use-case";
import { ReporteDiarioPdfGenerator } from "@/shared/infra/documents/reporte-diario-pdf.generator";

export interface GenerarReporteDiarioPdfInput {
  empresaId: string;
  fecha: Date;
}

export interface ReporteDiarioPdfResult {
  buffer: Buffer;
  filename: string;
}

/** Arma el PDF del reporte diario a partir de `ObtenerReporteDiarioData`. */
@injectable()
export class GenerarReporteDiarioPdf {
  constructor(
    @inject(DI_TYPES.ObtenerReporteDiarioData) private readonly obtenerReporteDiarioData: ObtenerReporteDiarioData,
    @inject(DI_TYPES.ReporteDiarioPdfGenerator) private readonly reporteDiarioPdfGenerator: ReporteDiarioPdfGenerator,
  ) {}

  async execute(input: GenerarReporteDiarioPdfInput): Promise<ReporteDiarioPdfResult> {
    const data = await this.obtenerReporteDiarioData.execute(input);
    const buffer = await this.reporteDiarioPdfGenerator.generate(data);
    const filename = `reporte-diario-${input.fecha.toISOString().slice(0, 10)}.pdf`;
    return { buffer, filename };
  }
}
