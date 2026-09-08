import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError } from "@/shared/infra/http/api.responses";
import { AsientoAImportar, ResultadoImportacionAsientos } from "@/modules/contabilidad/domain/importacion-asientos";
import { CrearAsiento } from "@/modules/contabilidad/use-cases/crear-asiento.use-case";

export interface ConfirmarImportacionAsientosInput {
  empresaId: string;
  /** Los asientos que la previsualización resolvió sin error (el usuario ya los revisó). */
  asientos: AsientoAImportar[];
  /** Si es `true`, cada asiento nace numerado y firme; si no (default), todos quedan en borrador para revisar antes de confirmarlos uno por uno. */
  confirmar?: boolean;
}

/**
 * Segundo paso de la importación de asientos: crea cada uno reutilizando
 * `CrearAsiento` — así toda la validación de negocio (período abierto,
 * partida doble, auxiliares obligatorios) es EXACTAMENTE la misma que la
 * carga manual, sin duplicar ninguna regla acá.
 *
 * Cada asiento se intenta de forma independiente: si uno falla (por
 * ejemplo, su fecha cae en un período que se cerró justo entre la
 * previsualización y la confirmación), los demás se siguen procesando — el
 * detalle dice cuál falló y por qué, para poder corregirlo y reintentar
 * solo ese sin perder el resto del lote.
 */
@injectable()
export class ConfirmarImportacionAsientos {
  constructor(@inject(DI_TYPES.CrearAsiento) private readonly crearAsiento: CrearAsiento) {}

  async execute(input: ConfirmarImportacionAsientosInput): Promise<ResultadoImportacionAsientos> {
    const detalle: ResultadoImportacionAsientos["detalle"] = [];
    let creados = 0;
    let fallidos = 0;

    for (const asiento of input.asientos) {
      try {
        const creado = await this.crearAsiento.execute({
          empresaId: input.empresaId,
          fecha: new Date(`${asiento.fecha}T00:00:00.000Z`),
          descripcion: asiento.descripcion,
          tipo: asiento.tipo,
          respaldo: asiento.respaldo,
          confirmar: input.confirmar ?? false,
          lineas: asiento.lineas,
        });
        detalle.push({ claveOriginal: asiento.claveOriginal, ok: true, numero: creado.numero });
        creados++;
      } catch (err) {
        detalle.push({
          claveOriginal: asiento.claveOriginal,
          ok: false,
          error: err instanceof ApiError ? err.message : "Error inesperado al crear el asiento",
        });
        fallidos++;
      }
    }

    return { creados, fallidos, detalle };
  }
}
