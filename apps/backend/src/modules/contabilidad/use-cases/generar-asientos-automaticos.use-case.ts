import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError } from "@/shared/infra/http/api.responses";
import { EstadoAsiento, RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento";
import { AsientoRepository, LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { validarLineasAsiento } from "@/modules/contabilidad/domain/validar-lineas";
import { EVENTOS_ASIENTO_LABELS, ORIGEN_TIPO_POR_EVENTO } from "@/modules/contabilidad/domain/regla-asiento";
import { ReglaAsientoRepository } from "@/modules/contabilidad/domain/regla-asiento.repository";
import { evaluarReglaAsiento, reglaAplicaAUnidad } from "@/modules/contabilidad/domain/evaluar-regla-asiento";
import {
  GenerarAsientosAutomaticosInput,
  ResultadoGenerarAsientosAutomaticos,
  UnidadEventoContable,
} from "@/modules/contabilidad/domain/eventos-contables";
import { ResolverContextoAsiento } from "@/modules/contabilidad/use-cases/resolver-contexto-asiento.use-case";

/**
 * El motor de asientos automáticos (fase 2): dado un evento de negocio y
 * sus "unidades" (ver `eventos-contables.ts`), busca las reglas activas de
 * ese evento, arma las líneas y crea/actualiza UN asiento en borrador por
 * documento de origen (`origenTipo` + `origenId`).
 *
 * Filosofía central: esto es un efecto secundario de mejor esfuerzo, NUNCA
 * un bloqueante de la operación de negocio que lo dispara. `execute` no
 * tira excepciones — devuelve `{generado, advertencia?}` para que el
 * "gancho" que la llama (en `boletas`, `cobros`, `cheques`,
 * `cargos-cuenta-corriente`, `compras`, `liquidacion-compra`,
 * `liquidacion-faena`) la use en un `try/catch` de una sola línea y, si
 * hubo un problema, lo junte como advertencia no bloqueante en la
 * respuesta — la boleta/cobro/compra se guarda igual.
 *
 * Reglas de convivencia con lo que ya existe:
 * - Un asiento CONFIRMADO nunca se toca acá — si el monto del documento
 *   cambia después de confirmado, se avisa pero no se edita (esa es una
 *   decisión manual, ver `ActualizarAsiento`/`AnularAsiento`).
 * - Si el documento deja de necesitar asiento (ej. una boleta que baja a
 *   $0 tras borrar todas sus ventas) y el automático existente estaba en
 *   BORRADOR, se borra — ya no describe ningún movimiento real.
 * - Si ninguna regla activa matchea alguna unidad, esa unidad se ignora
 *   (no rompe el resto) y se junta en la advertencia, para que se note que
 *   falta configurar una regla.
 */
@injectable()
export class GenerarAsientosAutomaticos {
  constructor(
    @inject(DI_TYPES.ReglaAsientoRepository) private readonly reglaAsientoRepository: ReglaAsientoRepository,
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.ResolverContextoAsiento) private readonly resolverContexto: ResolverContextoAsiento,
  ) {}

  async execute(input: GenerarAsientosAutomaticosInput): Promise<ResultadoGenerarAsientosAutomaticos> {
    const etiquetaEvento = EVENTOS_ASIENTO_LABELS[input.evento];
    const origenTipo = ORIGEN_TIPO_POR_EVENTO[input.evento];

    try {
      const reglas = await this.reglaAsientoRepository.listByEvento(input.empresaId, input.evento);

      const lineasGeneradas: ReturnType<typeof evaluarReglaAsiento> = [];
      let unidadesSinRegla = 0;
      for (const unidad of input.unidades) {
        const regla = reglas.find((r) => reglaAplicaAUnidad(r, unidad));
        if (!regla) {
          if (this.unidadTieneAlgunImporte(unidad)) unidadesSinRegla++;
          continue;
        }
        lineasGeneradas.push(...evaluarReglaAsiento(regla, unidad));
      }

      const existente = await this.asientoRepository.getByOrigen(input.empresaId, origenTipo, input.origenId);
      const advertenciaSinRegla =
        unidadesSinRegla > 0
          ? `${unidadesSinRegla === input.unidades.length ? "Ninguna" : "Parte"} de este movimiento no tiene una regla de asiento activa configurada para "${etiquetaEvento}" — revisá Contabilidad → Reglas de asiento.`
          : undefined;

      if (lineasGeneradas.length === 0) {
        if (existente && existente.estado === EstadoAsiento.BORRADOR) {
          await this.asientoRepository.delete(existente.id, input.empresaId);
          return { generado: true, advertencia: advertenciaSinRegla };
        }
        if (existente) {
          return {
            generado: false,
            advertencia: `Este movimiento ya no debería tener asiento, pero el automático existente (${existente.estado}, número ${existente.numero ?? "s/n"}) no se tocó — revisalo a mano.`,
          };
        }
        return { generado: false, advertencia: advertenciaSinRegla };
      }

      if (existente && existente.estado !== EstadoAsiento.BORRADOR) {
        return {
          generado: false,
          advertencia: `Ya existe un asiento ${existente.estado} (número ${existente.numero ?? "s/n"}) para este movimiento — no se modifica automáticamente. Si el monto cambió, ajustalo a mano.`,
        };
      }

      const { ejercicio, periodo } = await this.resolverContexto.execute(input.empresaId, input.fecha);

      const cuentas = await this.cuentaRepository.list(input.empresaId);
      const lineasInput: LineaAsientoInput[] = lineasGeneradas.map((linea) => ({
        cuentaId: linea.cuentaId,
        debe: linea.debe,
        haber: linea.haber,
        auxiliarTipo: linea.auxiliarTipo,
        auxiliarId: linea.auxiliarId,
        detalle: null,
        fechaOrigen: input.fecha,
      }));

      const errores = validarLineasAsiento(lineasInput, new Map(cuentas.map((c) => [c.id, c])));
      if (errores.length > 0) {
        return {
          generado: false,
          advertencia: `No se pudo generar el asiento automático de "${etiquetaEvento}": ${errores.join(" · ")} — revisá la configuración de la regla.`,
        };
      }

      if (existente) {
        await this.asientoRepository.update(existente.id, input.empresaId, {
          fecha: input.fecha,
          descripcion: input.descripcion,
          lineas: lineasInput,
        });
      } else {
        await this.asientoRepository.create({
          empresaId: input.empresaId,
          ejercicioId: ejercicio.id,
          periodoId: periodo.id,
          fecha: input.fecha,
          tipo: TipoAsiento.AUTOMATICO,
          estado: EstadoAsiento.BORRADOR,
          numero: null,
          respaldo: RespaldoAsiento.SIN_COMPROBANTE,
          descripcion: input.descripcion,
          origenTipo,
          origenId: input.origenId,
          lineas: lineasInput,
        });
      }

      return { generado: true, advertencia: advertenciaSinRegla };
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "error inesperado";
      return {
        generado: false,
        advertencia: `No se pudo generar/actualizar el asiento automático de "${etiquetaEvento}": ${mensaje}.`,
      };
    }
  }

  private unidadTieneAlgunImporte(unidad: UnidadEventoContable): boolean {
    return [
      unidad.monto,
      unidad.importeBruto,
      unidad.importeIva,
      unidad.totalGastos,
      unidad.ivaSobreGastos,
      unidad.totalTributos,
      unidad.total,
    ].some((valor) => typeof valor === "number" && valor !== 0);
  }
}
