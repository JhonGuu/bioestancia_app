import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Boleta, calcularFechaVencimiento } from "@/modules/boletas/domain/boleta";
import { BoletaRepository, CreateBoletaInput } from "@/modules/boletas/domain/boleta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { diasPlazoPagoEfectivo } from "@/modules/clientes/domain/cliente";
import { ClienteFinalRepository } from "@/modules/clientes/domain/cliente-final.repository";

export interface CreateBoletaItemUseCaseInput {
  /** Tropa de la que sale este ítem — requerido excepto en `compensacion_kg`. */
  compraId?: string;
  /** Requerido para `cabeza`/`media_res` (identifica el animal físico). */
  garron?: number;
  formaVenta: FormaVenta;
  /** Requerido excepto en `compensacion_kg`. Puede ser `CategoriaReventa.NOVILLO`. */
  categoria?: CategoriaVenta;
  kg: number;
  /** Destino de reventa (catálogo `clientes_finales`) — solo para clientes `esRevendedor`. */
  clienteFinalId?: string;
  comentarios?: string;
}

export type CreateBoletaUseCaseInput = Omit<CreateBoletaInput, "fechaVencimiento"> & {
  /**
   * Ítems de la boleta (cada garrón/media res/corte que se le entrega al
   * cliente). Puede venir vacío — una boleta se puede crear "en blanco" y
   * cargarle ventas después con `POST /ventas` (flujo de back-office) — pero
   * el flujo del operario (celular) siempre manda al menos uno.
   */
  items?: CreateBoletaItemUseCaseInput[];
};
// `fechaVencimiento` NO viene del caller (HTTP) — el use-case la calcula acá
// mismo a partir de `Cliente.diasPlazoPago` antes de llamar al repositorio.

export interface BoletaConVentas extends Boleta {
  ventas: Venta[];
}

/**
 * Crea una boleta y, si vienen `items`, las ventas asociadas en el mismo
 * request — pensado para el operario que carga desde el celular: entra el
 * cliente, la tropa, y va agregando garrones/medias reses/cortes con su
 * categoría y peso. El precio NO se carga acá (el operario no lo conoce) —
 * las ventas quedan "pendientes de precio" hasta que alguien de
 * administración/contable las complete con `SetPrecioVenta`
 * (`PATCH /ventas/:id/precio`).
 *
 * Nunca falla a mitad de camino silenciosamente: si algún ítem referencia
 * una compra que no existe (o no es de esta empresa), tira ANTES de crear
 * nada — se valida todo primero, se inserta después.
 */
@injectable()
export class CreateBoleta {
  constructor(
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.ClienteFinalRepository) private readonly clienteFinalRepository: ClienteFinalRepository,
  ) {}

  async execute(input: CreateBoletaUseCaseInput): Promise<BoletaConVentas> {
    const items = input.items ?? [];
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
    }
    await this.validarCompras(items, input.empresaId);
    await this.validarClientesFinales(items, input.empresaId, input.clienteId);

    const boleta = await this.boletaRepository.create({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      fecha: input.fecha,
      fechaVencimiento: calcularFechaVencimiento(input.fecha, diasPlazoPagoEfectivo(cliente)),
      numero: input.numero,
      comentarios: input.comentarios,
    });

    const ventas: Venta[] = [];
    for (const item of items) {
      const venta = await this.ventaRepository.create({
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        boletaId: boleta.id,
        compraId: item.compraId ?? null,
        garron: item.garron ?? null,
        formaVenta: item.formaVenta,
        categoria: item.categoria ?? null,
        kg: item.kg,
        // Sin precioKg/total a propósito — ver doc de la clase.
        fecha: input.fecha,
        clienteFinalId: item.clienteFinalId,
        comentarios: item.comentarios,
      });
      ventas.push(venta);
    }

    return { ...boleta, ventas };
  }

  /** Todas las `compraId` de los ítems tienen que existir y ser de la misma empresa. */
  private async validarCompras(items: CreateBoletaItemUseCaseInput[], empresaId: string): Promise<void> {
    const compraIds = [...new Set(items.map((i) => i.compraId).filter((id): id is string => Boolean(id)))];
    for (const compraId of compraIds) {
      const compra = await this.compraRepository.getById(compraId, empresaId);
      if (!compra) {
        throw new ApiError(`La compra ${compraId} no existe (o no es de esta empresa)`, Code.BAD_REQUEST);
      }
    }
  }

  /**
   * Todas las `clienteFinalId` de los ítems tienen que existir, ser de esta
   * empresa, Y pertenecer al mismo cliente (revendedor) de la boleta — evita
   * que un destino de "Ivan" quede anotado en una boleta de otro cliente.
   */
  private async validarClientesFinales(
    items: CreateBoletaItemUseCaseInput[],
    empresaId: string,
    clienteId: string,
  ): Promise<void> {
    const clienteFinalIds = [
      ...new Set(items.map((i) => i.clienteFinalId).filter((id): id is string => Boolean(id))),
    ];
    for (const clienteFinalId of clienteFinalIds) {
      const clienteFinal = await this.clienteFinalRepository.getById(clienteFinalId, empresaId);
      if (!clienteFinal) {
        throw new ApiError(
          `El destino ${clienteFinalId} no existe (o no es de esta empresa)`,
          Code.BAD_REQUEST,
        );
      }
      if (clienteFinal.clienteId !== clienteId) {
        throw new ApiError(`El destino ${clienteFinalId} no pertenece a este cliente`, Code.BAD_REQUEST);
      }
    }
  }
}
