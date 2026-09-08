import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { BoletaAImportar, FilaImportarBoletaConError, PreviewImportacionBoletas, VentaAImportar } from "@/modules/boletas/domain/importacion-boletas";
import {
  FilaPlanillaCliente,
  HOJAS_NO_CLIENTE,
  PlanillaHistorica,
  mapearFormaVenta,
} from "@/modules/boletas/infra/import/planilla-historica-cliente.util";
import { CeldaCruda, celdaATexto, parsearFechaExcel } from "@/modules/contabilidad/infra/import/excel-reader.util";

export interface PrevisualizarImportacionBoletasInput {
  empresaId: string;
  buffer: Buffer;
}

/** Insensible a mayúsculas/tildes/espacios extra — mismo criterio que `resolverAuxiliar` (asientos/saldos iniciales). */
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

/**
 * Primer paso del importador de boletas históricas: lee cada hoja de
 * cliente de `VENTAS 2026.xlsm` (una por cliente, formato de libro mayor —
 * ver `planilla-historica-cliente.util.ts`), se queda solo con las filas
 * `Tipo: Venta`, las agrupa por fecha (una boleta por cliente+día — decisión
 * de Juan Jose) y arma cada venta con la MISMA regla de kg que usa la carga
 * manual (`kg > 0` salvo `COMPENSACION_KG`, que siempre es `kg < 0`). No
 * escribe nada en la base — ni boletas/ventas ni clientes nuevos.
 */
@injectable()
export class PrevisualizarImportacionBoletas {
  constructor(@inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository) {}

  async execute(input: PrevisualizarImportacionBoletasInput): Promise<PreviewImportacionBoletas> {
    // Se parsea el libro UNA sola vez (ver comentario en `PlanillaHistorica`)
    // y se reusa para las ~80 hojas de cliente — parsear de nuevo por hoja
    // multiplicaría varios segundos por la cantidad de hojas.
    const planilla = PlanillaHistorica.desdeBuffer(input.buffer);
    const hojas = planilla.listarHojasClientes();
    const clientes = await this.clienteRepository.list(input.empresaId);
    const clientesPorNombre = new Map(clientes.map((c) => [normalizarNombre(nombreCliente(c)), c.id]));

    const aCrear: BoletaAImportar[] = [];
    const conError: FilaImportarBoletaConError[] = [];
    const clientesNuevos = new Set<string>();
    let totalFilasVenta = 0;

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

      const gruposPorFecha = new Map<string, FilaPlanillaCliente[]>();
      for (const fila of filas) {
        if (celdaATexto(fila.tipo) !== "Venta") continue;
        totalFilasVenta++;

        const fecha = parsearFechaExcel(fila.fecha);
        if (!fecha) {
          conError.push({ hoja, fila: fila.numero, errores: [`No se pudo interpretar la fecha "${celdaATexto(fila.fecha)}"`] });
          continue;
        }
        const claveFecha = fecha.toISOString().slice(0, 10);
        const lista = gruposPorFecha.get(claveFecha) ?? [];
        lista.push(fila);
        gruposPorFecha.set(claveFecha, lista);
      }

      for (const [fecha, filasGrupo] of gruposPorFecha) {
        const errores: string[] = [];
        const ventas: VentaAImportar[] = [];

        for (const fila of filasGrupo) {
          const formaTexto = celdaATexto(fila.formaVenta);
          const mapeada = mapearFormaVenta(formaTexto);
          if (!mapeada) {
            errores.push(`Fila ${fila.numero}: forma de venta no reconocida "${formaTexto}"`);
            continue;
          }

          const kg = numeroDeCelda(fila.kg);
          const kgValido = mapeada.formaVenta === FormaVenta.COMPENSACION_KG ? kg < 0 : kg > 0;
          if (!kgValido) {
            const regla = mapeada.formaVenta === FormaVenta.COMPENSACION_KG ? "tiene que ser negativo" : "tiene que ser mayor a 0";
            errores.push(`Fila ${fila.numero}: el kg ${regla} (vino "${celdaATexto(fila.kg)}")`);
            continue;
          }

          const importe = numeroDeCelda(fila.importe);
          const precioKg = importe !== 0 ? Math.round((importe / kg) * 100) / 100 : null;

          ventas.push({
            fila: fila.numero,
            formaVenta: mapeada.formaVenta,
            categoria: mapeada.categoria,
            kg,
            precioKg,
            observaciones: celdaATexto(fila.observaciones) || null,
          });
        }

        if (errores.length > 0) {
          conError.push({ hoja, fila: filasGrupo[0]!.numero, errores });
          continue;
        }

        aCrear.push({
          hoja,
          clienteId,
          clienteEsNuevo: clienteId === null,
          fecha,
          filas: filasGrupo.map((f) => f.numero),
          ventas,
          totalImporte: Math.round(ventas.reduce((acc, v) => acc + v.kg * (v.precioKg ?? 0), 0) * 100) / 100,
        });
      }
    }

    return {
      hojasProcesadas: hojas,
      hojasOmitidas: [...HOJAS_NO_CLIENTE],
      totalFilasVenta,
      clientesNuevos: [...clientesNuevos].sort(),
      aCrear: aCrear.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hoja.localeCompare(b.hoja)),
      conError,
    };
  }
}
