import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { EstadoAsiento } from "@/modules/contabilidad/domain/asiento";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { calcularSaldoCuenta } from "@/modules/contabilidad/domain/reportes";
import { ObtenerSaldosClientes } from "@/modules/cuenta-corriente/use-cases/obtener-saldos-clientes.use-case";

export interface ConciliacionClientesInput {
  empresaId: string;
  /** Cuenta de control (ej. "Deudores por ventas") contra la que se concilia. */
  cuentaId: string;
}

export interface FilaConciliacionCliente {
  clienteId: string;
  nombreCliente: string;
  /** Desde boletas/ventas/cobros/cargos — ver `calcularSaldoCliente`. */
  saldoAuxiliar: number;
  /** Desde el mayor de la cuenta, solo asientos CONFIRMADOS (ver `ObtenerMayorCuenta`). */
  saldoContable: number;
  diferencia: number;
}

export interface ConciliacionClientes {
  cuenta: { id: string; codigo: string; nombre: string };
  filas: FilaConciliacionCliente[];
  totalAuxiliar: number;
  totalContable: number;
  totalDiferencia: number;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Compara, cliente por cliente, el saldo de cuenta corriente (auxiliar —
 * calculado a partir de boletas/ventas/cobros/cargos, la misma lógica que
 * `modules/cuenta-corriente`) contra el saldo contable real de una cuenta de
 * control (ej. "Deudores por ventas") en el mayor, filtrado por auxiliar =
 * ese cliente.
 *
 * Una diferencia casi siempre delata: un asiento automático (fase 2)
 * generado en BORRADOR que todavía no se confirmó (el mayor solo cuenta
 * CONFIRMADOS, ver `ObtenerMayorCuenta`), un evento de negocio sin regla de
 * asiento configurada (no se generó ningún asiento), o un ajuste manual
 * hecho de un solo lado (solo en el auxiliar, o solo en la contabilidad).
 * Es una alarma para ir a revisar — no reemplaza al mayor real.
 *
 * Solo devuelve clientes con saldo distinto de cero de alguno de los dos
 * lados — no lista todo el padrón si está vacío de los dos lados.
 */
@injectable()
export class ObtenerConciliacionClientes {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.AsientoRepository) private readonly asientoRepository: AsientoRepository,
    @inject(DI_TYPES.ObtenerSaldosClientes) private readonly obtenerSaldosClientes: ObtenerSaldosClientes,
  ) {}

  async execute(input: ConciliacionClientesInput): Promise<ConciliacionClientes> {
    const cuenta = await this.cuentaRepository.getById(input.cuentaId, input.empresaId);
    if (!cuenta) {
      throw new ApiError("La cuenta no existe", Code.NOT_FOUND);
    }

    const [clientes, saldosAuxiliares, asientosConfirmados] = await Promise.all([
      this.clienteRepository.list(input.empresaId),
      this.obtenerSaldosClientes.execute({ empresaId: input.empresaId }),
      this.asientoRepository.list({
        empresaId: input.empresaId,
        cuentaId: input.cuentaId,
        estado: EstadoAsiento.CONFIRMADO,
      }),
    ]);

    const sumasPorCliente = new Map<string, { debe: number; haber: number }>();
    for (const asiento of asientosConfirmados) {
      for (const linea of asiento.lineas) {
        if (linea.cuentaId !== input.cuentaId) continue;
        if (linea.auxiliarTipo !== TipoAuxiliar.CLIENTE || !linea.auxiliarId) continue;
        const actual = sumasPorCliente.get(linea.auxiliarId) ?? { debe: 0, haber: 0 };
        actual.debe += linea.debe;
        actual.haber += linea.haber;
        sumasPorCliente.set(linea.auxiliarId, actual);
      }
    }

    const saldosAuxiliaresPorCliente = new Map(saldosAuxiliares.map((s) => [s.clienteId, s]));

    const filas: FilaConciliacionCliente[] = clientes
      .map((cliente): FilaConciliacionCliente => {
        const saldoAuxiliar = saldosAuxiliaresPorCliente.get(cliente.id)?.saldoTotal ?? 0;
        const sumas = sumasPorCliente.get(cliente.id) ?? { debe: 0, haber: 0 };
        const saldoContable = calcularSaldoCuenta(cuenta, sumas.debe, sumas.haber).saldo;
        return {
          clienteId: cliente.id,
          nombreCliente: nombreCliente(cliente),
          saldoAuxiliar,
          saldoContable,
          diferencia: redondear(saldoAuxiliar - saldoContable),
        };
      })
      .filter((f) => Math.abs(f.saldoAuxiliar) > 0.01 || Math.abs(f.saldoContable) > 0.01);

    const totalAuxiliar = redondear(filas.reduce((acc, f) => acc + f.saldoAuxiliar, 0));
    const totalContable = redondear(filas.reduce((acc, f) => acc + f.saldoContable, 0));

    return {
      cuenta: { id: cuenta.id, codigo: cuenta.codigo, nombre: cuenta.nombre },
      filas,
      totalAuxiliar,
      totalContable,
      totalDiferencia: redondear(totalAuxiliar - totalContable),
    };
  }
}
