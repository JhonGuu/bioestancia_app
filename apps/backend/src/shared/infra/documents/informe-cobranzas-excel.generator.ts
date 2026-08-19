import ExcelJS from "exceljs";
import { injectable } from "inversify";

import { InformeCobranzas, LineaInformeCobranza } from "@/modules/informe-cobranzas/domain/informe-cobranzas";
import { MEDIO_PAGO_LABELS, esMedioPagoCheque, esMedioPagoTransferencia } from "@/modules/cobros/domain/medio-pago";
import { formatearFechaUTC } from "@/shared/infra/documents/formato.util";

/** Mismo criterio que `detalleLinea()` en `informe-cobranzas-pdf.generator.ts` — sin el medio de pago (columna propia). */
function detalleLinea(linea: LineaInformeCobranza): string {
  const partes: string[] = [];
  if (esMedioPagoCheque(linea.medioPago) && linea.numeroCheque) {
    partes.push(`Cheque Nº: ${linea.numeroCheque}`);
  }
  if (esMedioPagoTransferencia(linea.medioPago)) {
    if (linea.bancoOBilletera) partes.push(linea.bancoOBilletera);
    if (linea.remitente) partes.push(`De: ${linea.remitente}`);
  }
  return partes.length > 0 ? partes.join(" — ") : "—";
}

/** Genera el Excel del informe de cobranzas: totales por medio de pago arriba + línea de tiempo completa debajo. */
@injectable()
export class InformeCobranzasExcelGenerator {
  async generate(data: InformeCobranzas): Promise<Buffer> {
    const { empresa } = data;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = empresa.razonSocial;
    workbook.created = data.generadoEn;

    const sheet = workbook.addWorksheet("Informe de cobranzas");
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 26;
    sheet.getColumn(3).width = 20;
    sheet.getColumn(4).width = 34;
    sheet.getColumn(5).width = 16;

    sheet.mergeCells(1, 1, 1, 5);
    sheet.getCell(1, 1).value = `Informe de cobranzas — ${empresa.razonSocial}`;
    sheet.getCell(1, 1).font = { bold: true, size: 14 };

    const periodo =
      data.desde || data.hasta
        ? `${data.desde ? formatearFechaUTC(data.desde) : "…"} — ${data.hasta ? formatearFechaUTC(data.hasta) : "…"}`
        : "Todo el historial";
    const filtroMedio = data.medioPagoFiltrado ? ` · ${MEDIO_PAGO_LABELS[data.medioPagoFiltrado]}` : "";
    sheet.mergeCells(2, 1, 2, 5);
    sheet.getCell(2, 1).value = `${periodo}${filtroMedio}`;
    sheet.getCell(2, 1).font = { bold: true };

    sheet.mergeCells(3, 1, 3, 5);
    sheet.getCell(3, 1).value = `Generado: ${formatearFechaUTC(data.generadoEn)}`;
    sheet.getCell(3, 1).font = { italic: true, size: 9 };

    sheet.addRow([]);

    const totalesHeaderRow = sheet.addRow(["Medio de pago", "Cantidad", "Total"]);
    totalesHeaderRow.font = { bold: true };
    for (const total of data.totalesPorMedioPago) {
      const row = sheet.addRow([MEDIO_PAGO_LABELS[total.medioPago], total.cantidad, total.total]);
      row.getCell(3).numFmt = '"$" #,##0.00';
    }
    const totalGeneralRow = sheet.addRow(["Total general", data.lineas.length, data.totalGeneral]);
    totalGeneralRow.font = { bold: true };
    totalGeneralRow.getCell(3).numFmt = '"$" #,##0.00';

    sheet.addRow([]);

    const headerRow = sheet.addRow(["Fecha", "Cliente", "Medio de pago", "Detalle", "Monto"]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E5E5" } };
      cell.border = { bottom: { style: "thin" } };
    });

    if (data.lineas.length === 0) {
      sheet.mergeCells(sheet.rowCount + 1, 1, sheet.rowCount + 1, 5);
      sheet.getCell(sheet.rowCount, 1).value = "Sin cobros en el período seleccionado.";
    }

    for (const linea of data.lineas) {
      const row = sheet.addRow([
        formatearFechaUTC(linea.fecha),
        linea.clienteNombre,
        MEDIO_PAGO_LABELS[linea.medioPago] ?? linea.medioPago,
        detalleLinea(linea),
        linea.monto,
      ]);
      row.getCell(5).numFmt = '"$" #,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
