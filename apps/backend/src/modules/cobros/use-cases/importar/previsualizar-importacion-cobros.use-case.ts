import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { MedioPago, esMedioPagoCheque } from "@/modules/cobros/domain/medio-pago";
import { CargoAImportar, CobroAImportar, FilaImportarCobroConError, PreviewImportacionCobros } from "@/modules/cobros/domain/importacion-cobros";
import { mapearConceptoPago } from "@/modules/cobros/infra/import/mapeo-concepto-pago.util";
import { FilaPlanillaCliente, HOJAS_NO_CLIENTE, PlanillaHistorica } from "@/modules/boletas/infra/import/planilla-historica-cliente.util";
import { CeldaCruda, celdaATexto, parsearFechaExcel } from "@/modules/contabilidad/infra/import/excel-reader.util";

export interface PrevisualizarImportacionCobrosInput {
  empresaId: string;
  buffer: Buffer;
}

/** Insensible a mayúsculas/tildes/espacios extra — mismo criterio que el resto de los resolvers de este importador. */
function normalizarNombre(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function numeroDeCelda(valor: CeldaCruda): number {
  const texto = celdaATexto(valor).replace(",", ".");
  const numero = Number(texto);
  return isFinite(numero) ? numero : 0;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Placeholder corto (varchar(50)/(100) en la tabla `cheques`) para cuando la hoja no trae número/banco reales — decisión de Juan Jose. */
function placeholderCheque(hoja: string, fila: number): { numeroCheque: string; bancoCheque: string } {
  return { numeroCheque: `S/D (fila ${fila})`, bancoCheque: "S/D" };
}

/**
 * Segundo paso del importador histórico: lee las filas `Tipo: Pago` de cada
 * hoja de cliente (las `Tipo: Venta` ya las cubre `PrevisualizarImportacionBoletas`)
 * y las separa en dos listas según el `Concepto` (ver
 * `mapeo-concepto-pago.util.ts`):
 *
 * - **Cobros** (Efectivo, Transferencia, Cheque, Cheque electrónico,
 *   Compensación, Retenciones, Pago genérico): una fila = un `Cobro` con una
 *   sola línea — la planilla no agrupa varios pagos del mismo día como sí
 *   hace con las ventas.
 * - **Cargos** (Recargo por cheque, Cheque Rechazado, Comisión Rechazo,
 *   Gasoil, Empleados, Ajuste por diferencia): una fila = un
 *   `CargoCuentaCorriente`.
 *
 * Las filas `Concepto: "Saldo inicial"` quedan fuera de alcance (se cuentan
 * aparte, no son error) — ver "Pregunta abierta pendiente" del plan. No
 * escribe nada en la base.
 */
@injectable()
export class PrevisualizarImportacionCobros {
  constructor(@inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository) {}

  async execute(input: PrevisualizarImportacionCobrosInput): Promise<PreviewImportacionCobros> {
    const planilla = PlanillaHistorica.desdeBuffer(input.buffer);
    const hojas = planilla.listarHojasClientes();
    const clientes = await this.clienteRepository.list(input.empresaId);
    const clientesPorNombre = new Map(clientes.map((c) => [normalizarNombre(nombreCliente(c)), c.id]));

    const cobrosACrear: CobroAImportar[] = [];
    const cargosACrear: CargoAImportar[] = [];
    const conError: FilaImportarCobroConError[] = [];
    const clientesNuevos = new Set<string>();
    let totalFilasPago = 0;
    let saldosInicialesOmitidos = 0;

    for (const hoja of hojas) {
      let filas: FilaPlanillaCliente[];
      try {
        filas = planilla.leerFilasCliente(hoja);
      } catch (err) {
        conError.push({ hoja, fila: 0, errores: [err instanceof ApiError ? err.message : "No se pudo leer la hoja"] });
        continue;
      }

      const clienteId = clientesPorNombre.get(normalizarNombre(hoja)) ?? null;
      if (!clienteId) clientesNuevos.add(hoja);

      for (const fila of filas) {
        if (celdaATexto(fila.tipo) !== "Pago") continue;
        totalFilasPago++;

        const conceptoTexto = celdaATexto(fila.concepto);
        const mapeado = mapearConceptoPago(conceptoTexto);
        if (!mapeado) {
          conError.push({ hoja, fila: fila.numero, errores: [`Fila ${fila.numero}: concepto no reconocido "${conceptoTexto}"`] });
          continue;
        }
        if (mapeado.tipo === "omitir") {
          saldosInicialesOmitidos++;
          continue;
        }

        const fecha = parsearFechaExcel(fila.fecha);
        if (!fecha) {
          conError.push({ hoja, fila: fila.numero, errores: [`Fila ${fila.numero}: no se pudo interpretar la fecha "${celdaATexto(fila.fecha)}"`] });
          continue;
        }
        const claveFecha = fecha.toISOString().slice(0, 10);
        const importe = numeroDeCelda(fila.importe);

        if (mapeado.tipo === "cobro") {
          if (importe >= 0) {
            conError.push({
              hoja,
              fila: fila.numero,
              errores: [`Fila ${fila.numero}: el importe de "${conceptoTexto}" tendría que ser negativo (vino "${celdaATexto(fila.importe)}")`],
            });
            continue;
          }
          const monto = redondear(-importe);
          const datosCheque = esMedioPagoCheque(mapeado.medioPago as MedioPago) ? placeholderCheque(hoja, fila.numero) : null;
          cobrosACrear.push({
            hoja,
            clienteId,
            clienteEsNuevo: clienteId === null,
            fila: fila.numero,
            fecha: claveFecha,
            medioPago: mapeado.medioPago,
            monto,
            numeroCheque: datosCheque?.numeroCheque ?? null,
            bancoCheque: datosCheque?.bancoCheque ?? null,
            observaciones: celdaATexto(fila.observaciones) || null,
          });
        } else {
          if (importe === 0) {
            conError.push({ hoja, fila: fila.numero, errores: [`Fila ${fila.numero}: el importe no puede ser cero`] });
            continue;
          }
          if (mapeado.signoEsperado === "positivo" && importe < 0) {
            conError.push({
              hoja,
              fila: fila.numero,
              errores: [`Fila ${fila.numero}: el importe de "${conceptoTexto}" tendría que ser positivo (vino "${celdaATexto(fila.importe)}")`],
            });
            continue;
          }
          cargosACrear.push({
            hoja,
            clienteId,
            clienteEsNuevo: clienteId === null,
            fila: fila.numero,
            fecha: claveFecha,
            tipo: mapeado.tipoCargo,
            monto: redondear(importe),
            motivo: celdaATexto(fila.observaciones) || conceptoTexto,
          });
        }
      }
    }

    const porFechaYFila = <T extends { fecha: string; fila: number }>(a: T, b: T): number =>
      a.fecha.localeCompare(b.fecha) || a.fila - b.fila;

    return {
      hojasProcesadas: hojas,
      hojasOmitidas: [...HOJAS_NO_CLIENTE],
      totalFilasPago,
      saldosInicialesOmitidos,
      clientesNuevos: [...clientesNuevos].sort(),
      cobrosACrear: cobrosACrear.sort(porFechaYFila),
      cargosACrear: cargosACrear.sort(porFechaYFila),
      conError,
    };
  }
}
