import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { redondear2 } from "@/modules/contabilidad/domain/asiento";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { tieneSaldoDeudor } from "@/modules/contabilidad/domain/tipo-cuenta";
import {
  FilaSaldoConError,
  PreviewImportacionSaldosIniciales,
  SaldoAImportar,
} from "@/modules/contabilidad/domain/importacion-saldos-iniciales";
import { celdaATexto, leerFilasExcel } from "@/modules/contabilidad/infra/import/excel-reader.util";
import { resolverAuxiliar } from "@/modules/contabilidad/infra/import/resolver-auxiliar.util";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";

export interface PrevisualizarImportacionSaldosInicialesInput {
  empresaId: string;
  buffer: Buffer;
}

/**
 * Parsea el Excel de saldos iniciales y resuelve cada fila contra el plan
 * de cuentas — mismo cálculo de lado (debe/haber según `tieneSaldoDeudor`)
 * que hace `GenerarAsientoApertura` y que ya se ve en vivo en
 * `apertura-form.tsx`. No escribe nada: el resultado (`aCargar`) es
 * exactamente la forma que espera ese endpoint, así el frontend lo manda
 * directo ahí una vez que el usuario lo revisó (y editó si hizo falta) en
 * el mismo formulario de apertura — no hace falta un endpoint de
 * confirmación separado para esta importación.
 *
 * Columnas del Excel (ver plantilla descargable): Cuenta (código),
 * Importe (con signo), Auxiliar (opcional — nombre del cliente, proveedor
 * o frigorífico, o el ID crudo para empleado/cuenta de fondos/cheque),
 * Detalle (opcional).
 */
@injectable()
export class PrevisualizarImportacionSaldosIniciales {
  constructor(
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: PrevisualizarImportacionSaldosInicialesInput): Promise<PreviewImportacionSaldosIniciales> {
    const { filas } = leerFilasExcel(input.buffer, {
      cuenta: { candidatos: ["cuenta", "codigocuenta"], requerida: true },
      importe: { candidatos: ["importe", "saldo"], requerida: true },
      auxiliar: { candidatos: ["auxiliar"] },
      detalle: { candidatos: ["detalle"] },
    });

    const [cuentas, clientes, proveedores, frigorificos] = await Promise.all([
      this.cuentaRepository.list(input.empresaId),
      this.clienteRepository.list(input.empresaId),
      this.proveedorRepository.list(input.empresaId),
      this.frigorificoRepository.list(input.empresaId),
    ]);
    const cuentasPorCodigo = new Map(cuentas.map((c) => [c.codigo, c]));
    const catalogosAuxiliares = { clientes, proveedores, frigorificos };

    const aCargar: SaldoAImportar[] = [];
    const conError: FilaSaldoConError[] = [];
    let totalDebe = 0;
    let totalHaber = 0;

    for (const fila of filas) {
      const codigoCuenta = celdaATexto(fila.valores.cuenta);
      const cuenta = cuentasPorCodigo.get(codigoCuenta);
      if (!cuenta) {
        conError.push({
          fila: fila.numero,
          codigoCuenta,
          errores: [`No existe ninguna cuenta con el código "${codigoCuenta}"`],
        });
        continue;
      }
      if (!cuenta.imputable) {
        conError.push({
          fila: fila.numero,
          codigoCuenta,
          errores: [`"${cuenta.codigo} ${cuenta.nombre}" es una cuenta de agrupación, no recibe saldo`],
        });
        continue;
      }

      const importe = redondear2(Number(celdaATexto(fila.valores.importe).replace(",", ".")) || 0);
      // Un saldo en cero no aporta nada al asiento — se saltea en silencio, igual que `GenerarAsientoApertura`.
      if (importe === 0) continue;

      let auxiliarId: string | null = null;
      if (cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO) {
        const textoAuxiliar = celdaATexto(fila.valores.auxiliar);
        const resuelto = resolverAuxiliar(cuenta.requiereAuxiliar, textoAuxiliar, catalogosAuxiliares);
        if (resuelto.error) {
          conError.push({
            fila: fila.numero,
            codigoCuenta,
            errores: [`"${cuenta.nombre}" es una cuenta de control — ${resuelto.error}`],
          });
          continue;
        }
        auxiliarId = resuelto.auxiliarId;
      }

      const alDebe = tieneSaldoDeudor(cuenta.tipo) === importe > 0;
      if (alDebe) totalDebe += Math.abs(importe);
      else totalHaber += Math.abs(importe);

      aCargar.push({
        fila: fila.numero,
        codigoCuenta: cuenta.codigo,
        nombreCuenta: cuenta.nombre,
        cuentaId: cuenta.id,
        importe,
        auxiliarTipo: cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO ? cuenta.requiereAuxiliar : null,
        auxiliarId,
        detalle: celdaATexto(fila.valores.detalle) || null,
      });
    }

    totalDebe = redondear2(totalDebe);
    totalHaber = redondear2(totalHaber);

    return {
      totalFilas: filas.length,
      aCargar: aCargar.sort((a, b) => a.codigoCuenta.localeCompare(b.codigoCuenta, "es", { numeric: true })),
      conError,
      totales: { debe: totalDebe, haber: totalHaber, diferencia: redondear2(totalDebe - totalHaber) },
    };
  }
}
