import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import {
  Asiento,
  EstadoAsiento,
  RespaldoAsiento,
  TipoAsiento,
  calcularTotales,
  redondear2,
} from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository, LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { EjercicioRepository } from "@/modules/contabilidad/domain/ejercicio.repository";
import { EstadoEjercicio } from "@/modules/contabilidad/domain/ejercicio";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { tieneSaldoDeudor } from "@/modules/contabilidad/domain/tipo-cuenta";

export interface SaldoInicialInput {
  cuentaId: string;
  /**
   * Importe con signo. Positivo = saldo del lado natural de la cuenta
   * (activo al debe, pasivo y PN al haber); negativo = del lado contrario,
   * que es como se carga por ejemplo una amortización acumulada.
   */
  importe: number;
  auxiliarTipo?: TipoAuxiliar | null;
  auxiliarId?: string | null;
  detalle?: string | null;
}

export interface GenerarAsientoAperturaInput {
  empresaId: string;
  ejercicioId: string;
  fecha?: Date;
  saldos: SaldoInicialInput[];
  /**
   * Si los saldos no cierran, la diferencia va a esta cuenta en vez de
   * rechazar todo. Sirve para arrancar desde un Excel incompleto sin
   * quedarse trabado: queda visible en el asiento, no escondida.
   */
  cuentaAjusteId?: string | null;
  descripcion?: string;
  confirmar?: boolean;
}

/**
 * Arma el asiento de apertura a partir de una lista de saldos iniciales:
 * vos cargás cuánto tiene cada cuenta y el sistema decide de qué lado va
 * según la naturaleza de la cuenta, y verifica que cierre.
 *
 * Es el camino cómodo. El otro sigue estando: escribir el asiento de
 * apertura a mano desde la carga de asientos, eligiendo el tipo "apertura"
 * y poniendo vos mismo debe y haber.
 *
 * Nace en BORRADOR salvo que se pida confirmarlo, así se puede revisar
 * antes de que consuma el número 1 del ejercicio.
 */
@injectable()
export class GenerarAsientoApertura {
  constructor(
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.EjercicioRepository) private readonly ejercicioRepository: EjercicioRepository,
  ) {}

  async execute(input: GenerarAsientoAperturaInput): Promise<Asiento> {
    const ejercicio = await this.ejercicioRepository.getById(input.ejercicioId, input.empresaId);
    if (!ejercicio) throw new ApiError("El ejercicio no existe", Code.NOT_FOUND);
    if (ejercicio.estado === EstadoEjercicio.CERRADO) {
      throw new ApiError("El ejercicio está cerrado", Code.BAD_REQUEST);
    }

    if (await this.asientoRepository.existePorTipo(ejercicio.id, TipoAsiento.APERTURA)) {
      throw new ApiError(
        `El ejercicio "${ejercicio.nombre}" ya tiene asiento de apertura — editá el que existe o anulalo antes de generar otro`,
        Code.BAD_REQUEST,
      );
    }

    const fecha = input.fecha ?? ejercicio.fechaInicio;
    const periodo = await this.ejercicioRepository.getPeriodoPorFecha(ejercicio.id, fecha);
    if (!periodo) {
      throw new ApiError("La fecha de apertura cae fuera de los períodos del ejercicio", Code.BAD_REQUEST);
    }

    const cuentas = await this.cuentaRepository.list(input.empresaId);
    const cuentasPorId = new Map(cuentas.map((cuenta) => [cuenta.id, cuenta]));

    const errores: string[] = [];
    const lineas: LineaAsientoInput[] = [];

    for (const saldo of input.saldos) {
      const importe = redondear2(saldo.importe);
      // Un saldo en cero no aporta nada al asiento: se saltea en silencio
      // para poder mandar el plan de cuentas entero desde la pantalla.
      if (importe === 0) continue;

      const cuenta = cuentasPorId.get(saldo.cuentaId);
      if (!cuenta) {
        errores.push("Hay un saldo cargado sobre una cuenta que no existe en esta empresa");
        continue;
      }
      if (!cuenta.imputable) {
        errores.push(`"${cuenta.codigo} ${cuenta.nombre}" es una cuenta de agrupación, no recibe saldo`);
        continue;
      }
      if (cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO && !saldo.auxiliarId) {
        errores.push(
          `"${cuenta.nombre}" es una cuenta de control: el saldo inicial hay que cargarlo por cada ${cuenta.requiereAuxiliar}`,
        );
        continue;
      }

      // Un importe positivo va al lado natural de la cuenta; uno negativo,
      // al contrario (así se carga, por ejemplo, una amortización acumulada).
      const esPositivo = importe > 0;
      const alDebe = tieneSaldoDeudor(cuenta.tipo) === esPositivo;
      const monto = Math.abs(importe);
      lineas.push({
        cuentaId: cuenta.id,
        debe: alDebe ? monto : 0,
        haber: alDebe ? 0 : monto,
        detalle: saldo.detalle ?? "Saldo inicial",
        auxiliarTipo: saldo.auxiliarTipo ?? (cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO ? cuenta.requiereAuxiliar : null),
        auxiliarId: saldo.auxiliarId ?? null,
        fechaOrigen: fecha,
      });
    }

    if (errores.length > 0) throw new ApiError(errores.join(" · "), Code.BAD_REQUEST);
    if (lineas.length === 0) {
      throw new ApiError("No hay ningún saldo inicial distinto de cero para abrir", Code.BAD_REQUEST);
    }

    const totales = calcularTotales(lineas);
    if (totales.diferencia !== 0) {
      if (!input.cuentaAjusteId) {
        throw new ApiError(
          `Los saldos iniciales no cierran: debe ${totales.debe} contra haber ${totales.haber} (diferencia de ${Math.abs(totales.diferencia)}). Revisalos, o elegí una cuenta de ajuste para mandar la diferencia ahí.`,
          Code.BAD_REQUEST,
        );
      }

      const cuentaAjuste = cuentasPorId.get(input.cuentaAjusteId);
      if (!cuentaAjuste || !cuentaAjuste.imputable) {
        throw new ApiError("La cuenta de ajuste no existe o no es imputable", Code.BAD_REQUEST);
      }

      const diferencia = Math.abs(totales.diferencia);
      lineas.push({
        cuentaId: cuentaAjuste.id,
        debe: totales.diferencia < 0 ? diferencia : 0,
        haber: totales.diferencia > 0 ? diferencia : 0,
        detalle: "Diferencia de saldos iniciales",
        fechaOrigen: fecha,
      });
    }

    const confirmar = input.confirmar ?? false;

    return this.asientoRepository.create({
      empresaId: input.empresaId,
      ejercicioId: ejercicio.id,
      periodoId: periodo.id,
      fecha,
      tipo: TipoAsiento.APERTURA,
      estado: confirmar ? EstadoAsiento.CONFIRMADO : EstadoAsiento.BORRADOR,
      numero: confirmar ? await this.asientoRepository.siguienteNumero(ejercicio.id) : null,
      // La apertura no tiene comprobante por naturaleza.
      respaldo: RespaldoAsiento.INTERNO,
      descripcion: input.descripcion?.trim() || `Asiento de apertura — ${ejercicio.nombre}`,
      lineas,
    });
  }
}
