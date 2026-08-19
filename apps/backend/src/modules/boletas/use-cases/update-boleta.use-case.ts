import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Boleta, calcularFechaVencimiento } from "@/modules/boletas/domain/boleta";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { diasPlazoPagoEfectivo } from "@/modules/clientes/domain/cliente";

export interface UpdateBoletaInput {
  id: string;
  empresaId: string;
  fecha?: Date;
  numero?: string | null;
  comentarios?: string | null;
}

/**
 * Corrige fecha/número/comentarios de una boleta ya cargada — para arreglar
 * una carga mal hecha. Si cambia `fecha`, recalcula `fechaVencimiento` con el
 * plazo de pago vigente del cliente (mismo cálculo que `CreateBoleta`).
 *
 * No toca las `ventas` de la boleta ni el precio — eso es
 * `UpdateVentaItem`/`SetPrecioVenta`.
 */
@injectable()
export class UpdateBoleta {
  constructor(
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
  ) {}

  async execute(input: UpdateBoletaInput): Promise<Boleta> {
    const boleta = await this.boletaRepository.getById(input.id, input.empresaId);
    if (!boleta) {
      throw new ApiError("Boleta no encontrada", Code.NOT_FOUND);
    }

    let fechaVencimiento: Date | undefined;
    if (input.fecha !== undefined) {
      const cliente = await this.clienteRepository.getById(boleta.clienteId, input.empresaId);
      if (!cliente) {
        throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
      }
      fechaVencimiento = calcularFechaVencimiento(input.fecha, diasPlazoPagoEfectivo(cliente));
    }

    return this.boletaRepository.update(input.id, input.empresaId, {
      fecha: input.fecha,
      fechaVencimiento,
      numero: input.numero,
      comentarios: input.comentarios,
    });
  }
}
