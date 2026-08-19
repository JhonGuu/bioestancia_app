import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { AplicacionCobroConCliente } from "@/modules/cobros/domain/aplicacion-cobro";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { SaldoCliente } from "@/modules/cuenta-corriente/domain/saldo-cliente";
import { calcularSaldoCliente } from "@/modules/cuenta-corriente/domain/calcular-saldo-cliente";

export interface ObtenerSaldosClientesInput {
  empresaId: string;
}

function agruparPor<T>(items: T[], clienteIdDe: (item: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of items) {
    const clienteId = clienteIdDe(item);
    const arr = mapa.get(clienteId) ?? [];
    arr.push(item);
    mapa.set(clienteId, arr);
  }
  return mapa;
}

/**
 * El saldo de cuenta corriente de TODOS los clientes de la empresa activa, de
 * una — pensado para un listado rápido (ver `modules/cuenta-corriente`
 * vista "Cuenta corriente" del frontend) donde mostrar saldo por cliente sin
 * hacer una consulta por cliente (`ObtenerSaldoCliente` llamado N veces).
 *
 * Trae boletas/ventas/aplicaciones/cobros/cargos de TODA la empresa de una
 * sola vez y agrupa en memoria por `clienteId`, reusando la misma lógica de
 * negocio que `ObtenerSaldoCliente` vía `calcularSaldoCliente` (función
 * pura) — así los dos endpoints nunca pueden dar resultados distintos para
 * el mismo cliente.
 */
@injectable()
export class ObtenerSaldosClientes {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: ObtenerSaldosClientesInput): Promise<SaldoCliente[]> {
    const [clientes, boletas, ventas, aplicaciones, cobros, cargos] = await Promise.all([
      this.clienteRepository.list(input.empresaId),
      this.boletaRepository.list(input.empresaId),
      this.ventaRepository.list(input.empresaId),
      this.cobroRepository.listAplicacionesActivasByEmpresa(input.empresaId),
      this.cobroRepository.list(input.empresaId),
      this.cargoCuentaCorrienteRepository.list(input.empresaId),
    ]);

    const boletasPorId = new Map(boletas.map((b) => [b.id, b]));
    const boletasPorCliente = agruparPor(boletas, (b) => b.clienteId);
    const ventasPorCliente = agruparPor(ventas, (v) => v.clienteId);
    const cobrosPorCliente = agruparPor(cobros, (c) => c.clienteId);
    const cargosPorCliente = agruparPor(cargos, (c) => c.clienteId);

    // Las aplicaciones ya vienen con clienteId (via join en el repositorio),
    // pero por las dudas se descartan las que apunten a una boleta que ya no
    // está en el mapa (no debería pasar — mismo empresaId — pero evita un
    // undefined silencioso si algún día hay datos inconsistentes).
    const aplicacionesPorCliente = agruparPor(
      aplicaciones.filter((a) => boletasPorId.has(a.boletaId)),
      (a: AplicacionCobroConCliente) => a.clienteId,
    );

    return clientes.map((cliente) =>
      calcularSaldoCliente(
        cliente.id,
        boletasPorCliente.get(cliente.id) ?? ([] as Boleta[]),
        ventasPorCliente.get(cliente.id) ?? ([] as Venta[]),
        aplicacionesPorCliente.get(cliente.id) ?? [],
        cobrosPorCliente.get(cliente.id) ?? [],
        cargosPorCliente.get(cliente.id) ?? ([] as CargoCuentaCorriente[]),
      ),
    );
  }
}
