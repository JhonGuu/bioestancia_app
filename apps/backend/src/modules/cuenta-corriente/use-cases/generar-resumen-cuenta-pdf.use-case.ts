import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ObtenerResumenCuentaData } from "@/modules/cuenta-corriente/use-cases/obtener-resumen-cuenta-data.use-case";
import { ResumenCuentaPdfGenerator } from "@/shared/infra/documents/resumen-cuenta-pdf.generator";

export interface GenerarResumenCuentaPdfInput {
  clienteId: string;
  empresaId: string;
}

export interface ResumenCuentaPdfResult {
  buffer: Buffer;
  filename: string;
}

/** Arma el PDF del resumen de cuenta a partir de `ObtenerResumenCuentaData`. */
@injectable()
export class GenerarResumenCuentaPdf {
  constructor(
    @inject(DI_TYPES.ObtenerResumenCuentaData) private readonly obtenerResumenCuentaData: ObtenerResumenCuentaData,
    @inject(DI_TYPES.ResumenCuentaPdfGenerator) private readonly resumenCuentaPdfGenerator: ResumenCuentaPdfGenerator,
  ) {}

  async execute(input: GenerarResumenCuentaPdfInput): Promise<ResumenCuentaPdfResult> {
    const data = await this.obtenerResumenCuentaData.execute(input);
    const buffer = await this.resumenCuentaPdfGenerator.generate(data);
    const filename = `resumen-cuenta-${data.cliente.id.slice(0, 8)}.pdf`;
    return { buffer, filename };
  }
}
