import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { ObtenerSaldoCliente } from "@/modules/cuenta-corriente/use-cases/obtener-saldo-cliente.use-case";
import { ObtenerMovimientosCuentaCorriente } from "@/modules/cuenta-corriente/use-cases/obtener-movimientos-cuenta-corriente.use-case";
import { ResumenCuentaData } from "@/modules/cuenta-corriente/domain/resumen-cuenta";

export interface ObtenerResumenCuentaDataInput {
  clienteId: string;
  empresaId: string;
}

/**
 * Junta todo lo que necesitan los generadores de PDF/Excel del resumen de
 * cuenta — reutiliza `ObtenerSaldoCliente`/`ObtenerMovimientosCuentaCorriente`
 * (misma fuente que ya usa la pantalla en vivo) en vez de recalcular la
 * agregación de nuevo acá.
 */
@injectable()
export class ObtenerResumenCuentaData {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
    @inject(DI_TYPES.ObtenerSaldoCliente) private readonly obtenerSaldoCliente: ObtenerSaldoCliente,
    @inject(DI_TYPES.ObtenerMovimientosCuentaCorriente)
    private readonly obtenerMovimientosCuentaCorriente: ObtenerMovimientosCuentaCorriente,
  ) {}

  async execute(input: ObtenerResumenCuentaDataInput): Promise<ResumenCuentaData> {
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
    }
    const empresa = await this.empresaRepository.getById(input.empresaId);
    if (!empresa) {
      throw new ApiError("Empresa no encontrada", Code.NOT_FOUND);
    }

    const [saldo, movimientos, boletas, cargos] = await Promise.all([
      this.obtenerSaldoCliente.execute(input),
      this.obtenerMovimientosCuentaCorriente.execute(input),
      this.boletaRepository.listByCliente(input.clienteId, input.empresaId),
      this.cargoCuentaCorrienteRepository.list(input.empresaId, input.clienteId),
    ]);

    return { cliente, empresa, saldo, movimientos, boletas, cargos, generadoEn: new Date() };
  }
}
