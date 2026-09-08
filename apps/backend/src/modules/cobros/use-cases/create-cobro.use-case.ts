import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { CobroConLineas, CobroRepository, CreateLineaCobroInput } from "@/modules/cobros/domain/cobro.repository";
import { MedioPago, esMedioPagoCheque } from "@/modules/cobros/domain/medio-pago";
import { AplicarCobroFifo } from "@/modules/cobros/use-cases/aplicar-cobro-fifo.use-case";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";

export interface CreateLineaCobroUseCaseInput {
  medioPago: MedioPago;
  monto: number;
  /** Requeridos solo si `medioPago` es CHEQUE o ECHEQ — ver validación abajo. */
  numeroCheque?: string;
  bancoCheque?: string;
  cuitLibradorCheque?: string;
  titularCheque?: string;
  fechaEmisionCheque?: Date;
  fechaPagoCheque?: Date;
  /** Opcionales, solo tienen sentido con TRANSFERENCIA_BANCO/BILLETERA_VIRTUAL. */
  bancoOBilletera?: string;
  remitente?: string;
}

export interface CreateCobroUseCaseInput {
  empresaId: string;
  clienteId: string;
  fecha: Date;
  comentarios?: string;
  lineas: CreateLineaCobroUseCaseInput[];
}

/**
 * Crea un cobro con sus líneas (uno o más medios de pago) y, en el mismo
 * request:
 *
 * 1. Por cada línea CHEQUE/ECHEQ, crea el `Cheque` correspondiente ANTES de
 *    la línea (`LineaCobro.chequeId` lo referencia) — nunca se crea un
 *    cheque desde otro lugar (ver `modules/cheques`).
 * 2. Aplica el monto total del cobro a las boletas pendientes del cliente
 *    con FIFO (`AplicarCobroFifo`) y persiste el resultado.
 */
@injectable()
export class CreateCobro {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.AplicarCobroFifo) private readonly aplicarCobroFifo: AplicarCobroFifo,
    @inject(DI_TYPES.GenerarAsientosAutomaticos) private readonly generarAsientosAutomaticos: GenerarAsientosAutomaticos,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: CreateCobroUseCaseInput): Promise<CobroConLineas> {
    const cliente = await this.clienteRepository.getById(input.clienteId, input.empresaId);
    if (!cliente) {
      throw new ApiError("El cliente no existe (o no es de esta empresa)", Code.BAD_REQUEST);
    }
    if (input.lineas.length === 0) {
      throw new ApiError("El cobro necesita al menos una línea", Code.BAD_REQUEST);
    }
    for (const linea of input.lineas) {
      if (linea.monto <= 0) {
        throw new ApiError("El monto de cada línea tiene que ser mayor a cero", Code.BAD_REQUEST);
      }
      if (esMedioPagoCheque(linea.medioPago)) {
        if (!linea.numeroCheque || !linea.bancoCheque || !linea.fechaEmisionCheque || !linea.fechaPagoCheque) {
          throw new ApiError(
            "Faltan datos del cheque (número, banco, fecha de emisión y fecha de pago) en una de las líneas",
            Code.BAD_REQUEST,
          );
        }
      }
    }

    const lineasConCheque: CreateLineaCobroInput[] = [];
    for (const linea of input.lineas) {
      if (esMedioPagoCheque(linea.medioPago)) {
        const cheque = await this.chequeRepository.create({
          empresaId: input.empresaId,
          clienteId: input.clienteId,
          // Validado arriba — no-null assertions serían redundantes acá, TS ya no se queja.
          numero: linea.numeroCheque as string,
          banco: linea.bancoCheque as string,
          cuitLibrador: linea.cuitLibradorCheque ?? null,
          titular: linea.titularCheque ?? null,
          fechaEmision: linea.fechaEmisionCheque as Date,
          fechaPago: linea.fechaPagoCheque as Date,
          monto: linea.monto,
        });
        lineasConCheque.push({ medioPago: linea.medioPago, monto: linea.monto, chequeId: cheque.id });
      } else {
        lineasConCheque.push({
          medioPago: linea.medioPago,
          monto: linea.monto,
          chequeId: null,
          bancoOBilletera: linea.bancoOBilletera ?? null,
          remitente: linea.remitente ?? null,
        });
      }
    }

    const cobro = await this.cobroRepository.create({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      fecha: input.fecha,
      comentarios: input.comentarios,
      lineas: lineasConCheque,
    });

    const montoTotal = lineasConCheque.reduce((acc, l) => acc + l.monto, 0);
    const aplicaciones = await this.aplicarCobroFifo.execute({
      clienteId: input.clienteId,
      empresaId: input.empresaId,
      montoDisponible: montoTotal,
    });
    if (aplicaciones.length > 0) {
      await this.cobroRepository.crearAplicaciones(
        aplicaciones.map((a) => ({ cobroId: cobro.id, boletaId: a.boletaId, monto: a.monto })),
      );
    }

    const { advertencia } = await this.generarAsientosAutomaticos.execute({
      empresaId: input.empresaId,
      evento: EventoAsiento.COBRO_REGISTRADO,
      origenId: cobro.id,
      fecha: cobro.fecha,
      descripcion: `Cobro de ${nombreCliente(cliente)}`,
      unidades: cobro.lineas.map((linea) => ({
        monto: linea.monto,
        medioPago: linea.medioPago,
        clienteId: input.clienteId,
        chequeId: linea.chequeId ?? undefined,
      })),
    });
    if (advertencia) this.logger.warn(advertencia);

    return cobro;
  }
}
