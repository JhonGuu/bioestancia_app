import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { SaldoCliente } from "@/modules/cuenta-corriente/domain/saldo-cliente";

export interface ObtenerSaldoClienteInput {
  clienteId: string;
  empresaId: string;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Calcula el saldo de cuenta corriente de un cliente — no lee de ninguna
 * tabla propia, agrega `boletas` + `ventas` + `AplicacionCobro` (de
 * `modules/cobros`) + `CargoCuentaCorriente` (recargo/comisión) al vuelo.
 * Ver `domain/saldo-cliente.ts`.
 */
@injectable()
export class ObtenerSaldoCliente {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: ObtenerSaldoClienteInput): Promise<SaldoCliente> {
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
    }

    const [boletas, ventas, aplicaciones, cobros, cargos] = await Promise.all([
      this.boletaRepository.listByCliente(input.clienteId, input.empresaId),
      this.ventaRepository.listByCliente(input.clienteId, input.empresaId),
      this.cobroRepository.listAplicacionesByCliente(input.clienteId, input.empresaId),
      this.cobroRepository.list(input.empresaId, input.clienteId),
      this.cargoCuentaCorrienteRepository.list(input.empresaId, input.clienteId),
    ]);

    const ventasPorBoleta = new Map<string, typeof ventas>();
    for (const venta of ventas) {
      if (!venta.boletaId) continue;
      const arr = ventasPorBoleta.get(venta.boletaId) ?? [];
      arr.push(venta);
      ventasPorBoleta.set(venta.boletaId, arr);
    }

    const aplicadoPorBoleta = new Map<string, number>();
    for (const aplicacion of aplicaciones) {
      aplicadoPorBoleta.set(
        aplicacion.boletaId,
        (aplicadoPorBoleta.get(aplicacion.boletaId) ?? 0) + aplicacion.monto,
      );
    }

    let saldoVencido = 0;
    let saldoPorVencer = 0;
    const ahora = Date.now();
    for (const boleta of boletas) {
      const ventasBoleta = ventasPorBoleta.get(boleta.id) ?? [];
      const { monto: montoBoleta } = calcularMontoBoleta(ventasBoleta);
      const aplicado = aplicadoPorBoleta.get(boleta.id) ?? 0;
      const saldo = redondear(montoBoleta - aplicado);
      if (saldo <= 0.01) continue;

      // Boletas sin fechaVencimiento (legado, previas a este campo) se
      // cuentan como vencidas — no hay info de plazo para asumir lo contrario.
      const vencida = boleta.fechaVencimiento ? boleta.fechaVencimiento.getTime() < ahora : true;
      if (vencida) {
        saldoVencido = redondear(saldoVencido + saldo);
      } else {
        saldoPorVencer = redondear(saldoPorVencer + saldo);
      }
    }

    // Los cargos (recargo por cheque, comisión por rechazo) no tienen fecha
    // de vencimiento propia — son una penalidad que se suma directo al
    // vencido, se espera que se cobren cuanto antes.
    for (const cargo of cargos) {
      if (!cargo.activo) continue;
      saldoVencido = redondear(saldoVencido + cargo.monto);
    }

    const totalCobrado = cobros
      .filter((c) => c.activo)
      .reduce((acc, c) => acc + c.lineas.reduce((accLinea, l) => accLinea + l.monto, 0), 0);
    const totalAplicado = aplicaciones.reduce((acc, a) => acc + a.monto, 0);
    const saldoAFavor = Math.max(0, redondear(totalCobrado - totalAplicado));

    return {
      clienteId: input.clienteId,
      saldoVencido,
      saldoPorVencer,
      saldoTotal: redondear(saldoVencido + saldoPorVencer),
      saldoAFavor,
    };
  }
}
