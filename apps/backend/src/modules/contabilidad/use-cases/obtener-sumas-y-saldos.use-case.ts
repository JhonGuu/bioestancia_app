import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { EstadoAsiento, redondear2 } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { MovimientoPorCuenta, SumaYSaldoNodo, armarSumasYSaldos } from "@/modules/contabilidad/domain/reportes";

export interface SumasYSaldosFiltros {
  empresaId: string;
  ejercicioId?: string;
  desde?: Date;
  /** Fecha de corte del informe. Sin ella, trae todo lo confirmado hasta hoy. */
  hasta?: Date;
}

export interface SumasYSaldos {
  arbol: SumaYSaldoNodo[];
  totalDebe: number;
  totalHaber: number;
  /** Tiene que dar 0 — es el control de partida doble a nivel de todo el libro. */
  diferencia: number;
}

/**
 * Sumas y saldos a una fecha de corte: cada cuenta imputable trae sus
 * propios movimientos confirmados, y cada cuenta de agrupación acumula lo
 * de sus hijas — se lee a cualquier nivel de la jerarquía (a 2 dígitos o
 * hasta la cuenta imputable).
 */
@injectable()
export class ObtenerSumasYSaldos {
  constructor(
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
  ) {}

  async execute(filtros: SumasYSaldosFiltros): Promise<SumasYSaldos> {
    const cuentas = await this.cuentaRepository.list(filtros.empresaId, false);

    const asientos = await this.asientoRepository.list({
      empresaId: filtros.empresaId,
      ejercicioId: filtros.ejercicioId,
      estado: EstadoAsiento.CONFIRMADO,
      desde: filtros.desde,
      hasta: filtros.hasta,
    });

    const movimientosPorCuenta = new Map<string, MovimientoPorCuenta>();
    let totalDebe = 0;
    let totalHaber = 0;
    for (const asiento of asientos) {
      for (const linea of asiento.lineas) {
        const actual = movimientosPorCuenta.get(linea.cuentaId) ?? { sumaDebe: 0, sumaHaber: 0 };
        actual.sumaDebe = redondear2(actual.sumaDebe + linea.debe);
        actual.sumaHaber = redondear2(actual.sumaHaber + linea.haber);
        movimientosPorCuenta.set(linea.cuentaId, actual);
        totalDebe = redondear2(totalDebe + linea.debe);
        totalHaber = redondear2(totalHaber + linea.haber);
      }
    }

    const arbol = armarSumasYSaldos(cuentas, movimientosPorCuenta);

    return { arbol, totalDebe, totalHaber, diferencia: redondear2(totalDebe - totalHaber) };
  }
}
