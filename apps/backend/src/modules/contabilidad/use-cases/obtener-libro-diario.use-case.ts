import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Asiento, EstadoAsiento, TotalesAsiento, calcularTotales } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository, ListarAsientosFiltros } from "@/modules/contabilidad/domain/asiento.repository";

export interface LibroDiarioFiltros extends ListarAsientosFiltros {
  /** Por default el diario solo muestra confirmados; con esto también trae borradores. */
  incluirBorradores?: boolean;
}

export interface LibroDiario {
  asientos: Asiento[];
  /** Control de partida doble a nivel de todo el libro, no solo asiento por asiento. */
  totales: TotalesAsiento;
}

/**
 * Libro diario: asientos en orden cronológico dentro del rango pedido.
 *
 * Por default solo trae CONFIRMADOS — un libro diario formal no incluye
 * borradores. Si el filtro pide un `estado` puntual, se respeta tal cual.
 */
@injectable()
export class ObtenerLibroDiario {
  constructor(@inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository) {}

  async execute(filtros: LibroDiarioFiltros): Promise<LibroDiario> {
    const { incluirBorradores, ...resto } = filtros;
    const estado = resto.estado ?? (incluirBorradores ? undefined : EstadoAsiento.CONFIRMADO);

    const asientos = await this.asientoRepository.list({ ...resto, estado });
    const todasLasLineas = asientos.flatMap((a) => a.lineas);
    return { asientos, totales: calcularTotales(todasLasLineas) };
  }
}
