import ExcelJS from "exceljs";
import { injectable } from "inversify";

import { ReporteDiarioData } from "@/modules/boletas/domain/reporte-diario";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { compraNumeroYLetra } from "@/modules/compras/domain/compra";
import { detalleVenta } from "@/modules/ventas/domain/forma-venta-labels";
import { formatearFechaUTC } from "@/shared/infra/documents/formato.util";

/**
 * Genera el Excel del reporte diario: una fila por ítem (venta), agrupadas
 * por cliente con una fila de subtotal después de cada grupo, y el total
 * general al final. Mismo criterio de detalle que el PDF — ver
 * `ObtenerReporteDiarioData`. Formato libre (columnas anchas, negrita en
 * headers/subtotales) para que sea prolijo abrir directo en Excel/Sheets.
 */
@injectable()
export class ReporteDiarioExcelGenerator {
  async generate(data: ReporteDiarioData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = data.empresa.razonSocial;
    workbook.created = new Date();

    const comprasPorId = new Map(data.compras.map((c) => [c.id, c]));

    const sheet = workbook.addWorksheet("Reporte diario");
    sheet.getColumn(1).width = 30;
    sheet.getColumn(2).width = 16;
    sheet.getColumn(3).width = 16;
    sheet.getColumn(4).width = 10;
    sheet.getColumn(5).width = 24;
    sheet.getColumn(6).width = 14;
    sheet.getColumn(7).width = 16;

    sheet.mergeCells(1, 1, 1, 7);
    sheet.getCell(1, 1).value = `Reporte diario — ${data.empresa.razonSocial}`;
    sheet.getCell(1, 1).font = { bold: true, size: 14 };

    sheet.mergeCells(2, 1, 2, 7);
    sheet.getCell(2, 1).value = formatearFechaUTC(data.fecha);
    sheet.getCell(2, 1).font = { italic: true };

    const headerRow = sheet.addRow([
      "Cliente",
      "Boleta",
      "Tropa",
      "Garrón",
      "Detalle",
      "Cantidad (Kg)",
      "Importe ($)",
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E5E5" } };
      cell.border = { bottom: { style: "thin" } };
    });

    if (data.grupos.length === 0) {
      sheet.mergeCells(4, 1, 4, 7);
      sheet.getCell(4, 1).value = "No hay boletas cargadas para este día.";
    }

    for (const grupo of data.grupos) {
      for (const item of grupo.items) {
        const numeroBoleta = item.boleta.numero ?? item.boleta.id.slice(0, 8);
        for (const venta of item.ventas) {
          const compra = venta.compraId ? comprasPorId.get(venta.compraId) : undefined;
          sheet.addRow([
            nombreCliente(grupo.cliente),
            numeroBoleta,
            compra ? compraNumeroYLetra(compra) : "—",
            venta.garron,
            detalleVenta(venta.formaVenta, venta.categoria),
            venta.kg,
            venta.total,
          ]);
        }
      }

      const notaPendientes =
        grupo.pendientesDePrecio > 0
          ? ` (${grupo.pendientesDePrecio} pendiente${grupo.pendientesDePrecio === 1 ? "" : "s"} de precio)`
          : "";
      const subtotalRow = sheet.addRow([
        `Subtotal ${nombreCliente(grupo.cliente)}${notaPendientes}`,
        "",
        "",
        "",
        "",
        grupo.totalKg,
        grupo.totalImporte,
      ]);
      subtotalRow.font = { bold: true };
    }

    if (data.grupos.length > 0) {
      const notaGeneral =
        data.totalPendientesDePrecio > 0
          ? ` (${data.totalPendientesDePrecio} pendiente${data.totalPendientesDePrecio === 1 ? "" : "s"} de precio)`
          : "";
      const totalRow = sheet.addRow([
        `TOTAL GENERAL${notaGeneral}`,
        "",
        "",
        "",
        "",
        data.totalGeneralKg,
        data.totalGeneralImporte,
      ]);
      totalRow.font = { bold: true, size: 12 };
      totalRow.eachCell((cell) => {
        cell.border = { top: { style: "thin" } };
      });
    }

    sheet.getColumn(6).numFmt = "#,##0.00";
    sheet.getColumn(7).numFmt = '"$" #,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
