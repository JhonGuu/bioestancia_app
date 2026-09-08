import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Logger } from "@/shared/infra/logger/logger";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";
import { AjusteAplicacionInput, CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { calcularMontoComisionRechazo } from "@/modules/cobros/domain/calcular-cargos-cheque";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";

export interface ConfirmarRechazoChequeInput {
  chequeId: string;
  empresaId: string;
  /**
   * Permite ajustar el monto sugerido (7% del cheque) antes de confirmar. Si
   * no viene, se usa el sugerido. `0` (o `undefined` con `sinComision:
   * true`) omite la comisión — pensado para cuando el cliente cancela el
   * cheque el mismo día y no corresponde cargarle nada.
   */
  comision?: number;
  /** El cliente canceló el cheque el mismo día — no aplicar la comisión del 7%, aunque no se haya mandado `comision`. */
  sinComision?: boolean;
}

export interface ResultadoConfirmarRechazoCheque {
  /** Cargo de la comisión del 7% — `null` si se omitió (`sinComision`/`comision: 0`). */
  cargoComision: CargoCuentaCorriente | null;
  /** Línea informativa "Cheque rechazo Nº: X" — siempre se crea, con comisión o sin ella. */
  cargoRechazo: CargoCuentaCorriente;
  /** Cuánto se pudo revertir realmente de lo aplicado a boletas (puede ser menor al monto del cheque si ya no quedaba tanto aplicado). */
  montoRevertido: number;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Confirma (a mano — ver `SugerirReversionChequeRechazado`) las
 * consecuencias de un cheque rechazado:
 *
 * 1. Revierte, en orden LIFO (lo aplicado más reciente primero), hasta el
 *    monto del cheque de las `AplicacionCobro` del cliente — esas boletas
 *    vuelven a tener saldo pendiente, porque esa plata nunca llegó de
 *    verdad. No se puede saber con precisión CUÁLES aplicaciones vinieron
 *    de este cheque puntual (un cobro puede mezclar varios medios de pago),
 *    por eso se revierte por orden de fecha, no por origen exacto.
 * 2. Crea el `CargoCuentaCorriente` de la comisión del 7%.
 */
@injectable()
export class ConfirmarRechazoCheque {
  constructor(
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
    @inject(DI_TYPES.GenerarAsientosAutomaticos) private readonly generarAsientosAutomaticos: GenerarAsientosAutomaticos,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: ConfirmarRechazoChequeInput): Promise<ResultadoConfirmarRechazoCheque> {
    const cheque = await this.chequeRepository.getById(input.chequeId, input.empresaId);
    if (!cheque) {
      throw new ApiError("Cheque no encontrado", Code.NOT_FOUND);
    }
    if (cheque.estado !== EstadoCheque.RECHAZADO) {
      throw new ApiError("El cheque no está marcado como rechazado", Code.BAD_REQUEST);
    }

    // Marcador de idempotencia: CHEQUE_RECHAZADO se crea siempre (con
    // comisión o sin ella), a diferencia de COMISION_RECHAZO que ahora es
    // opcional — por eso el chequeo de "ya confirmado" tiene que mirar este
    // tipo, no el de la comisión.
    const existente = await this.cargoCuentaCorrienteRepository.getByChequeYTipo(
      input.chequeId,
      TipoCargo.CHEQUE_RECHAZADO,
      input.empresaId,
    );
    if (existente) {
      throw new ApiError("Ya se confirmó el rechazo de este cheque", Code.CONFLICT);
    }

    const montoRevertido = await this.revertirAplicaciones(cheque.clienteId, input.empresaId, cheque.monto);

    const cargoRechazo = await this.cargoCuentaCorrienteRepository.create({
      empresaId: input.empresaId,
      clienteId: cheque.clienteId,
      tipo: TipoCargo.CHEQUE_RECHAZADO,
      monto: montoRevertido,
      chequeId: cheque.id,
      motivo: `Cheque rechazo Nº: ${cheque.numero}`,
      fecha: new Date(),
    });

    const advertenciaRechazo = (
      await this.generarAsientosAutomaticos.execute({
        empresaId: input.empresaId,
        evento: EventoAsiento.CARGO_RECHAZO_CHEQUE,
        origenId: cargoRechazo.id,
        fecha: cargoRechazo.fecha,
        descripcion: cargoRechazo.motivo ?? `Cheque rechazo Nº: ${cheque.numero}`,
        unidades: [{ monto: cargoRechazo.monto, clienteId: cargoRechazo.clienteId, chequeId: cheque.id }],
      })
    ).advertencia;
    if (advertenciaRechazo) this.logger.warn(advertenciaRechazo);

    let cargoComision: CargoCuentaCorriente | null = null;
    const comision = input.sinComision ? 0 : (input.comision ?? calcularMontoComisionRechazo(cheque.monto));
    if (comision > 0) {
      cargoComision = await this.cargoCuentaCorrienteRepository.create({
        empresaId: input.empresaId,
        clienteId: cheque.clienteId,
        tipo: TipoCargo.COMISION_RECHAZO,
        monto: comision,
        chequeId: cheque.id,
        motivo: `Comisión cheque rechazado Nº: ${cheque.numero}`,
        fecha: new Date(),
      });

      const advertenciaComision = (
        await this.generarAsientosAutomaticos.execute({
          empresaId: input.empresaId,
          evento: EventoAsiento.CARGO_COMISION_RECHAZO,
          origenId: cargoComision.id,
          fecha: cargoComision.fecha,
          descripcion: cargoComision.motivo ?? `Comisión cheque rechazado Nº: ${cheque.numero}`,
          unidades: [{ monto: cargoComision.monto, clienteId: cargoComision.clienteId, chequeId: cheque.id }],
        })
      ).advertencia;
      if (advertenciaComision) this.logger.warn(advertenciaComision);
    }

    return { cargoComision, cargoRechazo, montoRevertido };
  }

  /** Deshace, más reciente primero, hasta `monto` de lo aplicado a boletas de este cliente. Devuelve cuánto pudo revertir. */
  private async revertirAplicaciones(clienteId: string, empresaId: string, monto: number): Promise<number> {
    const aplicaciones = await this.cobroRepository.listAplicacionesByCliente(clienteId, empresaId);
    const ordenadas = [...aplicaciones].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    let restante = monto;
    const ajustes: AjusteAplicacionInput[] = [];
    for (const aplicacion of ordenadas) {
      if (restante <= 0.01) break;
      const aRevertir = Math.min(restante, aplicacion.monto);
      ajustes.push({ id: aplicacion.id, nuevoMonto: redondear(aplicacion.monto - aRevertir) });
      restante = redondear(restante - aRevertir);
    }

    if (ajustes.length > 0) {
      await this.cobroRepository.ajustarAplicaciones(ajustes);
    }
    return redondear(monto - restante);
  }
}
