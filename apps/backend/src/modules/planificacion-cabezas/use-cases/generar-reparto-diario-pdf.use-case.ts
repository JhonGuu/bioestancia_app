import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import {
  ObtenerRepartoDiario,
  ObtenerRepartoDiarioInput,
} from "@/modules/planificacion-cabezas/use-cases/obtener-reparto-diario.use-case";
import { RepartoDiarioPdfGenerator } from "@/shared/infra/documents/reparto-diario-pdf.generator";

export interface RepartoDiarioPdfResult {
  buffer: Buffer;
  filename: string;
}

/** Arma el PDF del reparto de un día a partir de `ObtenerRepartoDiario`. */
@injectable()
export class GenerarRepartoDiarioPdf {
  constructor(
    @inject(DI_TYPES.ObtenerRepartoDiario) private readonly obtenerRepartoDiario: ObtenerRepartoDiario,
    @inject(DI_TYPES.RepartoDiarioPdfGenerator)
    private readonly repartoDiarioPdfGenerator: RepartoDiarioPdfGenerator,
  ) {}

  async execute(input: ObtenerRepartoDiarioInput): Promise<RepartoDiarioPdfResult> {
    const data = await this.obtenerRepartoDiario.execute(input);
    const buffer = await this.repartoDiarioPdfGenerator.generate(data);
    const empresaSlug = data.empresa.razonSocial
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return { buffer, filename: `reparto-${empresaSlug}-${data.fecha}.pdf` };
  }
}
