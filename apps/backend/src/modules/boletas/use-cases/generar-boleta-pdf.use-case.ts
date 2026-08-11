import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { Compra } from "@/modules/compras/domain/compra";
import { BoletaPdfGenerator } from "@/shared/infra/documents/boleta-pdf.generator";

export interface GenerarBoletaPdfInput {
  id: string;
  empresaId: string;
}

export interface BoletaPdfResult {
  buffer: Buffer;
  filename: string;
}

/**
 * Arma el PDF de una boleta puntual (ver `BoletaPdfGenerator` para el
 * layout) — junta boleta + ventas + cliente + empresa y delega el dibujado.
 */
@injectable()
export class GenerarBoletaPdf {
  constructor(
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.BoletaPdfGenerator) private readonly boletaPdfGenerator: BoletaPdfGenerator,
  ) {}

  async execute(input: GenerarBoletaPdfInput): Promise<BoletaPdfResult> {
    const boleta = await this.boletaRepository.getById(input.id, input.empresaId);
    if (!boleta) {
      throw new ApiError("Boleta no encontrada", Code.NOT_FOUND);
    }

    const [ventas, cliente, empresa] = await Promise.all([
      this.ventaRepository.listByBoleta(boleta.id, input.empresaId),
      this.clienteRepository.getById(boleta.clienteId, input.empresaId),
      this.empresaRepository.getById(input.empresaId),
    ]);

    if (!cliente) {
      throw new ApiError("El cliente de esta boleta no existe (o no es de esta empresa)", Code.NOT_FOUND);
    }
    if (!empresa) {
      throw new ApiError("Empresa no encontrada", Code.NOT_FOUND);
    }

    // Solo las tropas que efectivamente aparecen en esta boleta (una boleta
    // rara vez tiene más de un puñado de ítems) — no hace falta traer todas
    // las compras de la empresa como sí hace el reporte diario.
    const compraIds = [...new Set(ventas.map((v) => v.compraId).filter((id): id is string => id !== null))];
    const compras = (
      await Promise.all(compraIds.map((id) => this.compraRepository.getById(id, input.empresaId)))
    ).filter((c): c is Compra => c !== null);

    const buffer = await this.boletaPdfGenerator.generate({ boleta, ventas, cliente, empresa, compras });
    const filename = `boleta-${boleta.numero ?? boleta.id.slice(0, 8)}.pdf`;
    return { buffer, filename };
  }
}
