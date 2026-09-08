import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { RespaldoAsiento, TipoAsiento, calcularTotales } from "@/modules/contabilidad/domain/asiento";
import { LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";
import { CentroCostoRepository } from "@/modules/contabilidad/domain/centro-costo.repository";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { validarLineasAsiento } from "@/modules/contabilidad/domain/validar-lineas";
import {
  AsientoAImportar,
  AsientoImportarConError,
  PreviewImportacionAsientos,
} from "@/modules/contabilidad/domain/importacion-asientos";
import {
  CeldaCruda,
  FilaExcel,
  celdaATexto,
  leerFilasExcel,
  mapearTexto,
  parsearFechaExcel,
} from "@/modules/contabilidad/infra/import/excel-reader.util";
import { resolverAuxiliar } from "@/modules/contabilidad/infra/import/resolver-auxiliar.util";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";

export interface PrevisualizarImportacionAsientosInput {
  empresaId: string;
  buffer: Buffer;
}

const TIPOS_ASIENTO_TEXTOS: Record<string, TipoAsiento> = {
  "": TipoAsiento.MANUAL,
  manual: TipoAsiento.MANUAL,
  apertura: TipoAsiento.APERTURA,
  cierre: TipoAsiento.CIERRE,
  refundicion: TipoAsiento.REFUNDICION,
  ajusteinflacion: TipoAsiento.AJUSTE_INFLACION,
  ajusteporinflacion: TipoAsiento.AJUSTE_INFLACION,
  reclasificacion: TipoAsiento.RECLASIFICACION,
};

const RESPALDOS_TEXTOS: Record<string, RespaldoAsiento> = {
  "": RespaldoAsiento.SIN_COMPROBANTE,
  concomprobante: RespaldoAsiento.CON_COMPROBANTE,
  sincomprobante: RespaldoAsiento.SIN_COMPROBANTE,
  interno: RespaldoAsiento.INTERNO,
};

const AUXILIARES_TEXTOS: Record<string, TipoAuxiliar> = {
  "": TipoAuxiliar.NINGUNO,
  ninguno: TipoAuxiliar.NINGUNO,
  cliente: TipoAuxiliar.CLIENTE,
  proveedor: TipoAuxiliar.PROVEEDOR,
  empleado: TipoAuxiliar.EMPLEADO,
  frigorifico: TipoAuxiliar.FRIGORIFICO,
  cuentadefondos: TipoAuxiliar.CUENTA_FONDOS,
  cuentafondos: TipoAuxiliar.CUENTA_FONDOS,
  cheque: TipoAuxiliar.CHEQUE,
};

function primerValorNoVacio(filas: FilaExcel[], campo: string): string {
  for (const fila of filas) {
    const texto = celdaATexto(fila.valores[campo]);
    if (texto) return texto;
  }
  return "";
}

function numeroDeCelda(valor: CeldaCruda): number {
  const texto = celdaATexto(valor).replace(",", ".");
  const numero = Number(texto);
  return isFinite(numero) ? numero : 0;
}

/**
 * Primer paso de la importación de asientos: parsea el Excel, agrupa las
 * filas por la columna "Asiento" (cada grupo es un asiento con sus líneas)
 * y arma cada uno con `validarLineasAsiento` — la MISMA validación que usa
 * la carga manual y la apertura, así un asiento que pasa la previsualización
 * es un asiento que `CrearAsiento` va a aceptar sin sorpresas. No escribe
 * nada en la base.
 *
 * Columnas del Excel (ver plantilla descargable): Asiento (clave que
 * agrupa las líneas de un mismo asiento), Fecha, Descripcion, Tipo
 * (opcional, default manual), Respaldo (opcional, default sin
 * comprobante), Cuenta, Debe, Haber, Detalle (opcional, por línea),
 * CentroCosto (opcional) y Auxiliar (opcional — nombre del cliente,
 * proveedor o frigorífico, o el ID crudo para empleado/cuenta de
 * fondos/cheque).
 */
@injectable()
export class PrevisualizarImportacionAsientos {
  constructor(
    @inject(DI_TYPES.CuentaRepository) private readonly cuentaRepository: CuentaRepository,
    @inject(DI_TYPES.CentroCostoRepository) private readonly centroCostoRepository: CentroCostoRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: PrevisualizarImportacionAsientosInput): Promise<PreviewImportacionAsientos> {
    const { filas } = leerFilasExcel(input.buffer, {
      asiento: { candidatos: ["asiento", "numeroasiento", "grupo"], requerida: true },
      fecha: { candidatos: ["fecha"], requerida: true },
      descripcion: { candidatos: ["descripcion", "concepto"] },
      tipo: { candidatos: ["tipo", "tipodeasiento"] },
      respaldo: { candidatos: ["respaldo"] },
      cuenta: { candidatos: ["cuenta", "codigocuenta"], requerida: true },
      debe: { candidatos: ["debe"] },
      haber: { candidatos: ["haber"] },
      detalleLinea: { candidatos: ["detalle", "glosa"] },
      centroCosto: { candidatos: ["centrodecosto", "centrocosto"] },
      auxiliar: { candidatos: ["auxiliar"] },
    });

    const grupos = new Map<string, FilaExcel[]>();
    for (const fila of filas) {
      const clave = celdaATexto(fila.valores.asiento) || `(fila ${fila.numero})`;
      const lista = grupos.get(clave) ?? [];
      lista.push(fila);
      grupos.set(clave, lista);
    }

    const [cuentas, centros, clientes, proveedores, frigorificos] = await Promise.all([
      this.cuentaRepository.list(input.empresaId),
      this.centroCostoRepository.list(input.empresaId),
      this.clienteRepository.list(input.empresaId),
      this.proveedorRepository.list(input.empresaId),
      this.frigorificoRepository.list(input.empresaId),
    ]);
    const cuentasPorCodigo = new Map(cuentas.map((c) => [c.codigo, c]));
    const cuentasPorId = new Map(cuentas.map((c) => [c.id, c]));
    const centrosPorCodigo = new Map(centros.map((c) => [c.codigo, c]));
    const catalogosAuxiliares = { clientes, proveedores, frigorificos };

    const aCrear: AsientoAImportar[] = [];
    const conError: AsientoImportarConError[] = [];

    for (const [clave, filasGrupo] of grupos) {
      const numerosFila = filasGrupo.map((f) => f.numero);
      const errores: string[] = [];

      const fechasDistintas = new Set(filasGrupo.map((f) => celdaATexto(f.valores.fecha)));
      if (fechasDistintas.size > 1) {
        errores.push(`Las filas de este asiento tienen fechas distintas (${[...fechasDistintas].join(", ")}) — tienen que ser todas iguales`);
      }
      const fecha = parsearFechaExcel(filasGrupo[0].valores.fecha);
      if (!fecha) errores.push(`No se pudo interpretar la fecha "${celdaATexto(filasGrupo[0].valores.fecha)}"`);

      const tipoTexto = primerValorNoVacio(filasGrupo, "tipo");
      const tipo = mapearTexto(tipoTexto, TIPOS_ASIENTO_TEXTOS);
      if (tipoTexto && !tipo) errores.push(`Tipo de asiento no reconocido: "${tipoTexto}"`);

      const respaldoTexto = primerValorNoVacio(filasGrupo, "respaldo");
      const respaldo = mapearTexto(respaldoTexto, RESPALDOS_TEXTOS);
      if (respaldoTexto && !respaldo) errores.push(`Respaldo no reconocido: "${respaldoTexto}"`);

      const descripcion = primerValorNoVacio(filasGrupo, "descripcion") || `Asiento importado — ${clave}`;

      const lineas: LineaAsientoInput[] = [];
      for (const fila of filasGrupo) {
        const codigoCuenta = celdaATexto(fila.valores.cuenta);
        const cuenta = cuentasPorCodigo.get(codigoCuenta);
        if (!cuenta) {
          errores.push(`Fila ${fila.numero}: no existe ninguna cuenta con el código "${codigoCuenta}"`);
          continue;
        }

        let auxiliarId: string | null = null;
        if (cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO) {
          const textoAuxiliar = celdaATexto(fila.valores.auxiliar);
          const resuelto = resolverAuxiliar(cuenta.requiereAuxiliar, textoAuxiliar, catalogosAuxiliares);
          if (resuelto.error) {
            errores.push(`Fila ${fila.numero}: "${cuenta.nombre}" es una cuenta de control — ${resuelto.error}`);
            continue;
          }
          auxiliarId = resuelto.auxiliarId;
        }

        const codigoCentro = celdaATexto(fila.valores.centroCosto);
        let centroCostoId: string | null = null;
        if (codigoCentro) {
          const centro = centrosPorCodigo.get(codigoCentro);
          if (!centro) {
            errores.push(`Fila ${fila.numero}: no existe ningún centro de costo con el código "${codigoCentro}"`);
            continue;
          }
          centroCostoId = centro.id;
        }

        lineas.push({
          cuentaId: cuenta.id,
          debe: numeroDeCelda(fila.valores.debe),
          haber: numeroDeCelda(fila.valores.haber),
          detalle: celdaATexto(fila.valores.detalleLinea) || null,
          auxiliarTipo: cuenta.requiereAuxiliar !== TipoAuxiliar.NINGUNO ? cuenta.requiereAuxiliar : null,
          auxiliarId,
          centroCostoId,
          fechaOrigen: fecha,
        });
      }

      if (lineas.length > 0) errores.push(...validarLineasAsiento(lineas, cuentasPorId));

      if (errores.length > 0) {
        conError.push({ claveOriginal: clave, filas: numerosFila, errores });
        continue;
      }

      const totales = calcularTotales(lineas);
      aCrear.push({
        claveOriginal: clave,
        filas: numerosFila,
        // `fecha` no puede ser null acá: si lo fuera, `errores` no estaría vacío y ya habríamos cortado arriba.
        fecha: fecha!.toISOString().slice(0, 10),
        descripcion,
        tipo: tipo ?? TipoAsiento.MANUAL,
        respaldo: respaldo ?? RespaldoAsiento.SIN_COMPROBANTE,
        lineas,
        totalDebe: totales.debe,
        totalHaber: totales.haber,
      });
    }

    return {
      totalFilas: filas.length,
      totalAsientos: grupos.size,
      aCrear: aCrear.sort((a, b) => a.fecha.localeCompare(b.fecha)),
      conError,
    };
  }
}
