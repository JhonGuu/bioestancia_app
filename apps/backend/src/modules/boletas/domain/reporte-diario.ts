import { Boleta } from "@/modules/boletas/domain/boleta";
import { Venta } from "@/modules/ventas/domain/venta";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { Empresa } from "@/modules/empresas/domain/empresa";
import { Compra } from "@/modules/compras/domain/compra";
import { StockTropa } from "@/modules/compras/domain/stock-tropa";

/** Una boleta del día, con sus ítems. */
export interface ReporteDiarioItem {
  boleta: Boleta;
  ventas: Venta[];
}

/**
 * Todo lo que un cliente cargó en el día: puede tener más de una boleta (no
 * es lo usual, pero el dominio no lo prohíbe — ver comentario en
 * `boleta.ts`). `pendientesDePrecio` cuenta ventas con `total === null`:
 * `totalImporte` solo suma lo que YA tiene precio, no se "anula" el total
 * por tener algún ítem pendiente — así el reporte sigue siendo útil aunque
 * falte cargar algún precio.
 */
export interface ReporteDiarioClienteGrupo {
  cliente: Cliente;
  items: ReporteDiarioItem[];
  totalKg: number;
  totalImporte: number;
  pendientesDePrecio: number;
}

export interface ReporteDiarioData {
  empresa: Empresa;
  /** El día del reporte (medianoche UTC, mismo criterio que `Boleta.fecha`). */
  fecha: Date;
  /** Un grupo por cliente que tuvo al menos una boleta ese día, ordenados alfabéticamente. */
  grupos: ReporteDiarioClienteGrupo[];
  /**
   * Todas las compras (tropas) de la empresa — igual criterio que `clientes`
   * en `ObtenerReporteDiarioData` (se traen todas en una sola query en vez de
   * una por venta, para no caer en N+1). Los generadores arman su propio
   * `Map<id, Compra>` para mostrar `numero`/`letra` en cada ítem
   * (`compraNumeroYLetra`, ver `modules/compras/domain/compra.ts`).
   */
  compras: Compra[];
  /**
   * Stock teórico de cada tropa ABIERTA de la empresa (no solo las que
   * tuvieron movimiento hoy) — para que el reporte del día también sirva
   * como "cuánto queda por repartir" (ver `ObtenerStockTropas`). Vacío si no
   * hay tropas abiertas.
   */
  stockTropas: StockTropa[];
  totalGeneralKg: number;
  totalGeneralImporte: number;
  totalPendientesDePrecio: number;
}
