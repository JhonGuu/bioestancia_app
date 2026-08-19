import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ObtenerInformeCobranzas, ObtenerInformeCobranzasInput } from "@/modules/informe-cobranzas/use-cases/obtener-informe-cobranzas.use-case";
import { InformeCobranzasPdfGenerator } from "@/shared/infra/documents/informe-cobranzas-pdf.generator";

export interface InformeCobranzasPdfResult {
  buffer: Buffer;
  filename: string;
}

/** Arma el PDF del informe de cobranzas a partir de `ObtenerInformeCobranzas`. */
@injectable()
export class GenerarInformeCobranzasPdf {
  constructor(
    @inject(DI_TYPES.ObtenerInformeCobranzas) private readonly obtenerInformeCobranzas: ObtenerInformeCobranzas,
    @inject(DI_TYPES.InformeCobranzasPdfGenerator)
    private readonly informeCobranzasPdfGenerator: InformeCobranzasPdfGenerator,
  ) {}

  async execute(input: ObtenerInformeCobranzasInput): Promise<InformeCobranzasPdfResult> {
    const data = await this.obtenerInformeCobranzas.execute(input);
    const buffer = await this.informeCobranzasPdfGenerator.generate(data);
    const filename = `informe-cobranzas-${new Date().toISOString().slice(0, 10)}.pdf`;
    return { buffer, filename };
  }
}
