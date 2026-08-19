import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { Cheque } from "@/modules/cheques/domain/cheque";
import {
  MovimientoCuentaCorriente,
  TipoMovimientoCuentaCorriente,
} from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente";
import {
  agruparVentasPorCategoria,
  DetalleCategoriaVenta,
} from "@/modules/ventas/domain/detalle-categoria-venta";
import { construirDetalleLineas, DetalleLineaCobro } from "@/modules/cobros/domain/detalle-linea-cobro";

export interface ObtenerMovimientosCuentaCorrienteInput {
  clienteId: string;
  empresaId: string;
}

/** Movimiento antes de calcularle el saldo corriente — con una fecha de desempate para orden estable. */
interface MovimientoBorrador {
  tipo: TipoMovimientoCuentaCorriente;
  fecha: Date;
  ordenSecundario: Date;
  boletaId: string | null;
  cobroId: string | null;
  cargoId: string | null;
  monto: number;
  saldoPendiente: number | null;
  fechaVencimiento: Date | null;
  /** Solo en movimientos CARGO — para que `impactoEnSaldo` pueda tratar CHEQUE_RECHAZADO como informativo (0). */
  cargoTipo: TipoCargo | null;
  /** Solo en movimientos BOLETA — ver `agruparVentasPorCategoria`. */
  detalleCategorias: DetalleCategoriaVenta[] | null;
  /** Solo en movimientos COBRO — ver `construirDetalleLineas`. */
  detalleLineas: DetalleLineaCobro[] | null;
  /**
   * Solo en movimientos COBRO: cuánto de ese cobro se aplicó de verdad a
   * boletas vía FIFO — puede ser menor que `monto` si sobró plata (queda
   * como "saldo a favor", ver `SaldoCliente.saldoAFavor`). Es lo que se usa
   * para acumular `saldoCorriente` (NO `monto`) — así el número final
   * coincide con `ObtenerSaldoCliente.saldoTotal` en vez de arrastrar el
   * excedente como si redujera deuda que en realidad no tenía adónde ir.
   */
  montoAplicado: number;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Cuánto de este movimiento afecta el saldo corriente acumulado (boletas/cargos
 * suman, cobros restan lo aplicado) — con una excepción: CHEQUE_RECHAZADO es
 * una línea puramente informativa ("Cheque rechazo Nº: X"), su efecto real en
 * el saldo ya quedó reflejado antes, en la reducción silenciosa de
 * `AplicacionCobro.monto` del cobro original (ver `ConfirmarRechazoCheque`) —
 * sumarla de nuevo acá duplicaría la deuda.
 */
function impactoEnSaldo(borrador: MovimientoBorrador): number {
  if (borrador.tipo === TipoMovimientoCuentaCorriente.COBRO) return -borrador.montoAplicado;
  if (borrador.cargoTipo === TipoCargo.CHEQUE_RECHAZADO) return 0;
  return borrador.monto;
}

/**
 * Arma el "resumen de cuenta" de un cliente: una línea de tiempo con las
 * boletas (deuda, ya facturadas), los cobros (pago), y los cargos (recargo
 * por cheque / comisión por rechazo, deuda), más viejo primero (orden de
 * libro contable: se lee de arriba hacia abajo y la última fila es el saldo
 * más actual), con el saldo corriente después de cada movimiento — mismo
 * formato que la hoja de cuenta corriente por cliente que ya usa la empresa.
 *
 * El saldo corriente acumulado tiene que coincidir con
 * `ObtenerSaldoCliente.saldoTotal` en el último movimiento — por eso un
 * cobro resta lo que se APLICÓ de verdad a boletas (`montoAplicado`, vía
 * FIFO), no el monto total cobrado: si sobra plata (queda como "saldo a
 * favor", un número aparte, ver `SaldoCliente.saldoAFavor`), esa parte no
 * reduce el saldo corriente porque en los hechos no canceló ninguna deuda.
 */
@injectable()
export class ObtenerMovimientosCuentaCorriente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
  ) {}

  async execute(input: ObtenerMovimientosCuentaCorrienteInput): Promise<MovimientoCuentaCorriente[]> {
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
    }

    const [boletas, ventas, aplicaciones, cobros, cargos, cheques] = await Promise.all([
      this.boletaRepository.listByCliente(input.clienteId, input.empresaId),
      this.ventaRepository.listByCliente(input.clienteId, input.empresaId),
      this.cobroRepository.listAplicacionesByCliente(input.clienteId, input.empresaId),
      this.cobroRepository.list(input.empresaId, input.clienteId),
      this.cargoCuentaCorrienteRepository.list(input.empresaId, input.clienteId),
      this.chequeRepository.list(input.empresaId, { clienteId: input.clienteId }),
    ]);
    const chequesPorId = new Map<string, Cheque>(cheques.map((c) => [c.id, c]));

    const ventasPorBoleta = new Map<string, typeof ventas>();
    for (const venta of ventas) {
      if (!venta.boletaId) continue;
      const arr = ventasPorBoleta.get(venta.boletaId) ?? [];
      arr.push(venta);
      ventasPorBoleta.set(venta.boletaId, arr);
    }

    const aplicadoPorBoleta = new Map<string, number>();
    const aplicadoPorCobro = new Map<string, number>();
    for (const aplicacion of aplicaciones) {
      aplicadoPorBoleta.set(
        aplicacion.boletaId,
        (aplicadoPorBoleta.get(aplicacion.boletaId) ?? 0) + aplicacion.monto,
      );
      aplicadoPorCobro.set(aplicacion.cobroId, (aplicadoPorCobro.get(aplicacion.cobroId) ?? 0) + aplicacion.monto);
    }

    const borradores: MovimientoBorrador[] = [];

    for (const boleta of boletas) {
      const ventasBoleta = ventasPorBoleta.get(boleta.id) ?? [];
      const { facturada, monto } = calcularMontoBoleta(ventasBoleta);
      if (!facturada) continue; // boleta pendiente de precio: todavía no es un movimiento de cuenta.
      const aplicado = aplicadoPorBoleta.get(boleta.id) ?? 0;
      borradores.push({
        tipo: TipoMovimientoCuentaCorriente.BOLETA,
        fecha: boleta.fecha,
        ordenSecundario: boleta.createdAt,
        boletaId: boleta.id,
        cobroId: null,
        cargoId: null,
        monto: redondear(monto),
        saldoPendiente: redondear(monto - aplicado),
        fechaVencimiento: boleta.fechaVencimiento,
        cargoTipo: null,
        detalleCategorias: agruparVentasPorCategoria(ventasBoleta),
        detalleLineas: null,
        montoAplicado: 0,
      });
    }

    for (const cobro of cobros) {
      if (!cobro.activo) continue;
      const montoCobro = cobro.lineas.reduce((acc, l) => acc + l.monto, 0);
      borradores.push({
        tipo: TipoMovimientoCuentaCorriente.COBRO,
        fecha: cobro.fecha,
        ordenSecundario: cobro.createdAt,
        boletaId: null,
        cobroId: cobro.id,
        cargoId: null,
        monto: redondear(montoCobro),
        saldoPendiente: null,
        fechaVencimiento: null,
        cargoTipo: null,
        detalleCategorias: null,
        detalleLineas: construirDetalleLineas(cobro.lineas, chequesPorId),
        montoAplicado: redondear(aplicadoPorCobro.get(cobro.id) ?? 0),
      });
    }

    for (const cargo of cargos) {
      if (!cargo.activo) continue;
      borradores.push({
        tipo: TipoMovimientoCuentaCorriente.CARGO,
        fecha: cargo.fecha,
        ordenSecundario: cargo.createdAt,
        boletaId: null,
        cobroId: null,
        cargoId: cargo.id,
        monto: redondear(cargo.monto),
        saldoPendiente: null,
        fechaVencimiento: null,
        cargoTipo: cargo.tipo,
        detalleCategorias: null,
        detalleLineas: null,
        montoAplicado: 0,
      });
    }

    // Ascendente (más viejo primero) para poder acumular el saldo corriente.
    borradores.sort((a, b) => {
      const diff = a.fecha.getTime() - b.fecha.getTime();
      return diff !== 0 ? diff : a.ordenSecundario.getTime() - b.ordenSecundario.getTime();
    });

    let saldoAcumulado = 0;
    const movimientos: MovimientoCuentaCorriente[] = borradores.map((b) => {
      saldoAcumulado = redondear(saldoAcumulado + impactoEnSaldo(b));
      return {
        tipo: b.tipo,
        fecha: b.fecha,
        boletaId: b.boletaId,
        cobroId: b.cobroId,
        cargoId: b.cargoId,
        monto: b.monto,
        saldoPendiente: b.saldoPendiente,
        fechaVencimiento: b.fechaVencimiento,
        detalleCategorias: b.detalleCategorias,
        detalleLineas: b.detalleLineas,
        saldoCorriente: saldoAcumulado,
      };
    });

    // Se devuelve más viejo primero (formato libro contable, ver comentario de la clase).
    return movimientos;
  }
}
