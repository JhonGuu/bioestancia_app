import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { nombreCliente, diasPlazoPagoEfectivo } from "@/modules/clientes/domain/cliente";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { calcularFechaVencimiento } from "@/modules/boletas/domain/boleta";
import { CreateVenta } from "@/modules/ventas/use-cases/create-venta.use-case";
import { BoletaAImportar, ResultadoImportacionBoletas } from "@/modules/boletas/domain/importacion-boletas";

export interface ConfirmarImportacionBoletasInput {
  empresaId: string;
  /** Los grupos que la previsualización resolvió sin error (el usuario ya los revisó). */
  boletas: BoletaAImportar[];
}

function normalizarNombre(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Segundo paso de la importación de boletas históricas: crea cada grupo
 * cliente+día como una `Boleta`, con sus `Venta` ya con `precioKg` cargado
 * (a diferencia del flujo del operario — `CreateBoleta` — acá el precio ya
 * se conoce, es un hecho pasado).
 *
 * A propósito NO usa `CreateBoleta` (fuerza ventas sin precio) ni dispara
 * ningún asiento automático — `CreateVenta`/`BoletaRepository.create` no
 * disparan `GenerarAsientosAutomaticos` por sí solos (confirmado revisando
 * `SetPrecioVenta`, que sí lo hace). Esto es intencional: el efecto contable
 * acumulado de todo este historial lo va a cubrir el asiento de apertura al
 * final de la migración (`GenerarAsientoApertura`) — si cada venta histórica
 * disparara también su asiento, la plata quedaría contada dos veces (ver
 * `plan-carga-inicial-datos.md`).
 *
 * Si la hoja no tiene un cliente ya cargado (`clienteId: null` en la
 * previsualización), lo crea acá con `razonSocial` = nombre de la hoja, sin
 * separar nombre/apellido (decisión de Juan Jose) — una sola vez por hoja,
 * aunque la hoja tenga varios grupos (boletas de distintos días).
 */
@injectable()
export class ConfirmarImportacionBoletas {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.CreateVenta) private readonly createVenta: CreateVenta,
  ) {}

  async execute(input: ConfirmarImportacionBoletasInput): Promise<ResultadoImportacionBoletas> {
    const detalle: ResultadoImportacionBoletas["detalle"] = [];
    let creadas = 0;
    let fallidas = 0;

    const clientes = await this.clienteRepository.list(input.empresaId);
    const clienteIdPorNombre = new Map(clientes.map((c) => [normalizarNombre(nombreCliente(c)), c.id]));

    for (const grupo of input.boletas) {
      try {
        const clienteId = await this.resolverOCrearCliente(input.empresaId, grupo, clienteIdPorNombre);
        const cliente = await this.clienteRepository.getById(clienteId, input.empresaId);
        if (!cliente) throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);

        const fecha = new Date(`${grupo.fecha}T00:00:00.000Z`);
        const boleta = await this.boletaRepository.create({
          empresaId: input.empresaId,
          clienteId,
          fecha,
          fechaVencimiento: calcularFechaVencimiento(fecha, diasPlazoPagoEfectivo(cliente)),
          comentarios: `Importado de la hoja "${grupo.hoja}"`,
        });

        for (const venta of grupo.ventas) {
          await this.createVenta.execute({
            empresaId: input.empresaId,
            clienteId,
            boletaId: boleta.id,
            compraId: null,
            garron: null,
            formaVenta: venta.formaVenta,
            categoria: venta.categoria,
            kg: venta.kg,
            precioKg: venta.precioKg ?? undefined,
            fecha,
            clienteFinalId: null,
            comentarios: venta.observaciones ?? undefined,
          });
        }

        detalle.push({ hoja: grupo.hoja, fecha: grupo.fecha, ok: true, boletaId: boleta.id });
        creadas++;
      } catch (err) {
        detalle.push({
          hoja: grupo.hoja,
          fecha: grupo.fecha,
          ok: false,
          error: err instanceof ApiError ? err.message : "Error inesperado al crear la boleta",
        });
        fallidas++;
      }
    }

    return { creadas, fallidas, detalle };
  }

  /** Cachea (`clienteIdPorNombre`) para no crear el mismo cliente dos veces dentro de la misma confirmación. */
  private async resolverOCrearCliente(
    empresaId: string,
    grupo: BoletaAImportar,
    clienteIdPorNombre: Map<string, string>,
  ): Promise<string> {
    if (grupo.clienteId) return grupo.clienteId;

    const clave = normalizarNombre(grupo.hoja);
    const existente = clienteIdPorNombre.get(clave);
    if (existente) return existente;

    const nuevo = await this.clienteRepository.create({
      empresaId,
      razonSocial: grupo.hoja,
      condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    });
    clienteIdPorNombre.set(clave, nuevo.id);
    return nuevo.id;
  }
}
