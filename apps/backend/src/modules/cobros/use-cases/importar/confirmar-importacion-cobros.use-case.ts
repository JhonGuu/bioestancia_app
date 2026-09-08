import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError } from "@/shared/infra/http/api.responses";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { esMedioPagoCheque } from "@/modules/cobros/domain/medio-pago";
import { AplicarCobroFifo } from "@/modules/cobros/use-cases/aplicar-cobro-fifo.use-case";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { CargoAImportar, CobroAImportar, ResultadoImportacionCobros, ResultadoImportacionCobrosItem } from "@/modules/cobros/domain/importacion-cobros";

export interface ConfirmarImportacionCobrosInput {
  empresaId: string;
  /** Lo que la previsualización clasificó como pago real (los que pasaron sin error). */
  cobros: CobroAImportar[];
  /** Lo que la previsualización clasificó como cargo administrativo. */
  cargos: CargoAImportar[];
}

function normalizarNombre(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

type ItemAImportar = { kind: "cobro"; data: CobroAImportar } | { kind: "cargo"; data: CargoAImportar };

/**
 * Tercer paso de la importación histórica: persiste los `Cobro`
 * (con su línea, y su `Cheque` si corresponde) y los `CargoCuentaCorriente`
 * que resolvió `PrevisualizarImportacionCobros`.
 *
 * Dos decisiones de diseño, ambas explicadas en `plan-carga-inicial-datos.md`:
 *
 * 1. **No dispara `GenerarAsientosAutomaticos`** — construye sobre
 *    `CobroRepository`/`CargoCuentaCorrienteRepository` directamente en vez
 *    de `CreateCobro`/`CreateCargoCuentaCorriente` (que sí lo disparan). El
 *    efecto contable acumulado de todo el historial lo va a cubrir el
 *    asiento de apertura al final de la migración — repetirlo acá
 *    duplicaría la plata contabilizada.
 * 2. **Procesa TODO en orden cronológico estricto** (cobros y cargos
 *    mezclados, ordenados por fecha y por fila) antes de aplicar cada
 *    cobro por FIFO (`AplicarCobroFifo`) — el algoritmo mira el estado de
 *    aplicaciones previas en el momento de cada llamada, así que el orden
 *    de reproducción importa para reconstruir bien qué boleta saldó cada
 *    pago histórico. Los cargos no participan del FIFO (no tocan boletas),
 *    así que su posición relativa a los cobros no cambia el resultado —
 *    ordenarlos junto es solo para simplificar el loop.
 *
 * Igual que en boletas: si la hoja no tiene cliente ya cargado, lo crea acá
 * (razonSocial = nombre de hoja), cacheado para no crearlo dos veces.
 */
@injectable()
export class ConfirmarImportacionCobros {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.ChequeRepository) private readonly chequeRepository: ChequeRepository,
    @inject(DI_TYPES.CobroRepository) private readonly cobroRepository: CobroRepository,
    @inject(DI_TYPES.AplicarCobroFifo) private readonly aplicarCobroFifo: AplicarCobroFifo,
    @inject(DI_TYPES.CargoCuentaCorrienteRepository)
    private readonly cargoCuentaCorrienteRepository: CargoCuentaCorrienteRepository,
  ) {}

  async execute(input: ConfirmarImportacionCobrosInput): Promise<ResultadoImportacionCobros> {
    const clientes = await this.clienteRepository.list(input.empresaId);
    const clienteIdPorNombre = new Map(clientes.map((c) => [normalizarNombre(nombreCliente(c)), c.id]));

    const items: ItemAImportar[] = [
      ...input.cobros.map((data): ItemAImportar => ({ kind: "cobro", data })),
      ...input.cargos.map((data): ItemAImportar => ({ kind: "cargo", data })),
    ].sort((a, b) => a.data.fecha.localeCompare(b.data.fecha) || a.data.fila - b.data.fila);

    const detalle: ResultadoImportacionCobrosItem[] = [];
    let creados = 0;
    let fallidos = 0;

    for (const item of items) {
      try {
        const clienteId = await this.resolverOCrearCliente(input.empresaId, item.data, clienteIdPorNombre);
        const id =
          item.kind === "cobro"
            ? await this.crearCobro(input.empresaId, clienteId, item.data)
            : await this.crearCargo(input.empresaId, clienteId, item.data);
        detalle.push({ hoja: item.data.hoja, fila: item.data.fila, tipo: item.kind, fecha: item.data.fecha, ok: true, id });
        creados++;
      } catch (err) {
        detalle.push({
          hoja: item.data.hoja,
          fila: item.data.fila,
          tipo: item.kind,
          fecha: item.data.fecha,
          ok: false,
          error: err instanceof ApiError ? err.message : "Error inesperado al importar la fila",
        });
        fallidos++;
      }
    }

    return { creados, fallidos, detalle };
  }

  private async crearCobro(empresaId: string, clienteId: string, data: CobroAImportar): Promise<string> {
    const fecha = new Date(`${data.fecha}T00:00:00.000Z`);

    let chequeId: string | null = null;
    if (esMedioPagoCheque(data.medioPago)) {
      const cheque = await this.chequeRepository.create({
        empresaId,
        clienteId,
        numero: data.numeroCheque ?? "S/D",
        banco: data.bancoCheque ?? "S/D",
        fechaEmision: fecha,
        fechaPago: fecha,
        monto: data.monto,
      });
      chequeId = cheque.id;
    }

    const cobro = await this.cobroRepository.create({
      empresaId,
      clienteId,
      fecha,
      comentarios: `Importado de la hoja "${data.hoja}"${data.observaciones ? ` — ${data.observaciones}` : ""}`,
      lineas: [{ medioPago: data.medioPago, monto: data.monto, chequeId }],
    });

    const aplicaciones = await this.aplicarCobroFifo.execute({ clienteId, empresaId, montoDisponible: data.monto });
    if (aplicaciones.length > 0) {
      await this.cobroRepository.crearAplicaciones(
        aplicaciones.map((a) => ({ cobroId: cobro.id, boletaId: a.boletaId, monto: a.monto })),
      );
    }

    return cobro.id;
  }

  private async crearCargo(empresaId: string, clienteId: string, data: CargoAImportar): Promise<string> {
    const cargo = await this.cargoCuentaCorrienteRepository.create({
      empresaId,
      clienteId,
      tipo: data.tipo,
      monto: data.monto,
      motivo: data.motivo ?? undefined,
      fecha: new Date(`${data.fecha}T00:00:00.000Z`),
    });
    return cargo.id;
  }

  /** Cachea (`clienteIdPorNombre`) para no crear el mismo cliente dos veces dentro de la misma confirmación. */
  private async resolverOCrearCliente(
    empresaId: string,
    item: { hoja: string; clienteId: string | null },
    clienteIdPorNombre: Map<string, string>,
  ): Promise<string> {
    if (item.clienteId) return item.clienteId;

    const clave = normalizarNombre(item.hoja);
    const existente = clienteIdPorNombre.get(clave);
    if (existente) return existente;

    const nuevo = await this.clienteRepository.create({
      empresaId,
      razonSocial: item.hoja,
      condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    });
    clienteIdPorNombre.set(clave, nuevo.id);
    return nuevo.id;
  }
}
