import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { ObtenerStockTropas } from "@/modules/compras/use-cases/obtener-stock-tropas.use-case";
import {
  ReporteDiarioData,
  ReporteDiarioClienteGrupo,
  ReporteDiarioItem,
} from "@/modules/boletas/domain/reporte-diario";

export interface ObtenerReporteDiarioDataInput {
  empresaId: string;
  /** Medianoche UTC del día pedido — ver `formatearFechaQuery` en el controller. */
  fecha: Date;
}

/**
 * Arma el reporte diario: todas las boletas de la empresa en `fecha`,
 * agrupadas por cliente, con sus ítems y subtotales. Lo consumen tanto el
 * generador de PDF como el de Excel — la data se arma una sola vez acá para
 * no duplicar la lógica de agrupación/totales en cada formato de salida.
 *
 * Solo 5 queries sin importar cuántas boletas haya ese día (evita el N+1 de
 * pedir las ventas/tropas boleta por boleta): boletas del rango, ventas del
 * rango (agrupadas en memoria por `boletaId`), todos los clientes de la
 * empresa (mapeados por id), todas las compras de la empresa (para mostrar
 * número/letra de tropa por ítem — ver `compraNumeroYLetra`), y la empresa.
 *
 * También agrega `stockTropas` (ver `ObtenerStockTropas`) — no es gratis (un
 * query extra por tropa abierta), pero el reporte diario se pide una vez por
 * día, no es un endpoint de alto volumen.
 */
@injectable()
export class ObtenerReporteDiarioData {
  constructor(
    @inject(DI_TYPES.EmpresaRepository) private readonly empresaRepository: EmpresaRepository,
    @inject(DI_TYPES.BoletaRepository) private readonly boletaRepository: BoletaRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.ObtenerStockTropas) private readonly obtenerStockTropas: ObtenerStockTropas,
  ) {}

  async execute(input: ObtenerReporteDiarioDataInput): Promise<ReporteDiarioData> {
    const empresa = await this.empresaRepository.getById(input.empresaId);
    if (!empresa) {
      throw new ApiError("Empresa no encontrada", Code.NOT_FOUND);
    }

    const desde = input.fecha;
    const hasta = new Date(desde);
    hasta.setUTCDate(hasta.getUTCDate() + 1);

    const [boletasDelDia, ventasDelDia, clientes, compras, stockTropas] = await Promise.all([
      this.boletaRepository.listByRango(input.empresaId, desde, hasta),
      this.ventaRepository.listByEmpresaYRango(input.empresaId, desde, hasta),
      this.clienteRepository.list(input.empresaId),
      this.compraRepository.list(input.empresaId),
      this.obtenerStockTropas.execute({ empresaId: input.empresaId }),
    ]);

    const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

    const ventasPorBoleta = new Map<string, Venta[]>();
    for (const venta of ventasDelDia) {
      if (!venta.boletaId) continue;
      const lista = ventasPorBoleta.get(venta.boletaId) ?? [];
      lista.push(venta);
      ventasPorBoleta.set(venta.boletaId, lista);
    }

    const itemsPorCliente = new Map<string, ReporteDiarioItem[]>();
    for (const boleta of boletasDelDia) {
      const items = itemsPorCliente.get(boleta.clienteId) ?? [];
      items.push({ boleta, ventas: ventasPorBoleta.get(boleta.id) ?? [] });
      itemsPorCliente.set(boleta.clienteId, items);
    }

    const grupos: ReporteDiarioClienteGrupo[] = [];
    let totalGeneralKg = 0;
    let totalGeneralImporte = 0;
    let totalPendientesDePrecio = 0;

    for (const [clienteId, items] of itemsPorCliente) {
      // No debería pasar (un cliente con boleta siempre existe), pero un
      // soft-delete entre medio no tiene por qué romper el reporte.
      const cliente = clientesPorId.get(clienteId);
      if (!cliente) continue;

      let totalKg = 0;
      let totalImporte = 0;
      let pendientesDePrecio = 0;
      for (const item of items) {
        for (const venta of item.ventas) {
          totalKg += venta.kg;
          if (venta.total === null) pendientesDePrecio += 1;
          else totalImporte += venta.total;
        }
      }

      grupos.push({ cliente, items, totalKg, totalImporte, pendientesDePrecio });
      totalGeneralKg += totalKg;
      totalGeneralImporte += totalImporte;
      totalPendientesDePrecio += pendientesDePrecio;
    }

    grupos.sort((a, b) => nombreCliente(a.cliente).localeCompare(nombreCliente(b.cliente), "es"));

    return {
      empresa,
      fecha: input.fecha,
      grupos,
      compras,
      stockTropas,
      totalGeneralKg,
      totalGeneralImporte,
      totalPendientesDePrecio,
    };
  }
}
