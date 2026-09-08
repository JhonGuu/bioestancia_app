import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Asiento, EstadoAsiento } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { MovimientoMayor, armarMayorCuenta, calcularSaldoCuenta } from "@/modules/contabilidad/domain/reportes";

export interface MayorCuentaFiltros {
  empresaId: string;
  cuentaId: string;
  desde?: Date;
  hasta?: Date;
  /** Desagrega el mayor de una cuenta de control a un solo auxiliar (ej. un cliente puntual). */
  auxiliarId?: string;
}

export interface MayorCuenta {
  cuenta: { id: string; codigo: string; nombre: string };
  saldoAnterior: number;
  movimientos: MovimientoMayor[];
  saldoFinal: number;
}

/**
 * Mayor de una cuenta: saldo anterior al rango pedido + movimientos con
 * saldo corrido, en el orden en que ya vienen (fecha, número de asiento).
 * Con `auxiliarId` abre el mayor de una cuenta de control (ej. "Deudores
 * por ventas") a un solo cliente/proveedor.
 */
@injectable()
export class ObtenerMayorCuenta {
  constructor(
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
  ) {}

  async execute(filtros: MayorCuentaFiltros): Promise<MayorCuenta> {
    const cuenta = await this.cuentaRepository.getById(filtros.cuentaId, filtros.empresaId);
    if (!cuenta) throw new ApiError("La cuenta no existe", Code.NOT_FOUND);

    let saldoAnterior = 0;
    if (filtros.desde) {
      const previos = await this.asientoRepository.list({
        empresaId: filtros.empresaId,
        cuentaId: filtros.cuentaId,
        estado: EstadoAsiento.CONFIRMADO,
        hasta: new Date(filtros.desde.getTime() - 1),
      });
      const lineasPrevias = this.lineasDeLaCuenta(previos, filtros);
      const sumaDebe = lineasPrevias.reduce((acc, l) => acc + l.debe, 0);
      const sumaHaber = lineasPrevias.reduce((acc, l) => acc + l.haber, 0);
      saldoAnterior = calcularSaldoCuenta(cuenta, sumaDebe, sumaHaber).saldo;
    }

    const asientosDelRango = await this.asientoRepository.list({
      empresaId: filtros.empresaId,
      cuentaId: filtros.cuentaId,
      estado: EstadoAsiento.CONFIRMADO,
      desde: filtros.desde,
      hasta: filtros.hasta,
    });

    const movimientos = this.lineasDeLaCuenta(asientosDelRango, filtros).map((linea) => ({
      asientoId: linea.asientoId,
      numero: linea.numero,
      fecha: linea.fecha,
      descripcion: linea.descripcion,
      detalle: linea.detalle,
      auxiliarTipo: linea.auxiliarTipo,
      auxiliarId: linea.auxiliarId,
      debe: linea.debe,
      haber: linea.haber,
    }));

    const { movimientos: movsConSaldo, saldoFinal } = armarMayorCuenta(cuenta, saldoAnterior, movimientos);

    return {
      cuenta: { id: cuenta.id, codigo: cuenta.codigo, nombre: cuenta.nombre },
      saldoAnterior,
      movimientos: movsConSaldo,
      saldoFinal,
    };
  }

  /** Aplana asiento + línea, filtrando por la cuenta (y opcionalmente el auxiliar) pedidos. */
  private lineasDeLaCuenta(asientos: Asiento[], filtros: MayorCuentaFiltros) {
    return asientos.flatMap((asiento) =>
      asiento.lineas
        .filter(
          (linea) =>
            linea.cuentaId === filtros.cuentaId && (!filtros.auxiliarId || linea.auxiliarId === filtros.auxiliarId),
        )
        .map((linea) => ({
          asientoId: asiento.id,
          numero: asiento.numero,
          fecha: asiento.fecha,
          descripcion: asiento.descripcion,
          detalle: linea.detalle,
          auxiliarTipo: linea.auxiliarTipo,
          auxiliarId: linea.auxiliarId,
          debe: linea.debe,
          haber: linea.haber,
        })),
    );
  }
}
