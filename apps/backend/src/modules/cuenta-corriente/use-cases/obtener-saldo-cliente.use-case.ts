import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { SaldoCliente } from "@/modules/cuenta-corriente/domain/saldo-cliente";
import { calcularSaldoCliente } from "@/modules/cuenta-corriente/domain/calcular-saldo-cliente";

export interface ObtenerSaldoClienteInput {
  clienteId: string;
  empresaId: string;
}

/**
 * Calcula el saldo de cuenta corriente de un cliente — no lee de ninguna
 * tabla propia, agrega `boletas` + `ventas` + `AplicacionCobro` (de
 * `modules/cobros`) + `CargoCuentaCorriente` (recargo/comisión) al vuelo. La
 * lógica de negocio en sí vive en `domain/calcular-saldo-cliente.ts` (función
 * pura, compartida con `ObtenerSaldosClientes` — ver ese archivo para el
 * porqué). Ver `domain/saldo-cliente.ts`.
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

    return calcularSaldoCliente(input.clienteId, boletas, ventas, aplicaciones, cobros, cargos);
  }
}
