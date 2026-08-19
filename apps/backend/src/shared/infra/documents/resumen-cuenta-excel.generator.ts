import ExcelJS from "exceljs";
import { injectable } from "inversify";

import { ResumenCuentaData } from "@/modules/cuenta-corriente/domain/resumen-cuenta";
import { TipoMovimientoCuentaCorriente } from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { formatearFechaUTC } from "@/shared/infra/documents/formato.util";
import { construirLineasDetalleMovimiento } from "@/shared/infra/documents/detalle-movimiento-texto.util";

const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimientoCuentaCorriente, string> = {
  [TipoMovimientoCuentaCorriente.BOLETA]: "Boleta",
  [TipoMovimientoCuentaCorriente.COBRO]: "Cobro",
  [TipoMovimientoCuentaCorriente.CARGO]: "Cargo",
};

/** Genera el Excel del resumen de cuenta: saldo arriba + línea de tiempo de movimientos debajo. */
@injectable()
export class ResumenCuentaExcelGenerator {
  async generate(data: ResumenCuentaData): Promise<Buffer> {
    const { cliente, empresa, saldo, movimientos, boletas, cargos } = data;
    const boletasPorId = new Map(boletas.map((b) => [b.id, b]));
    const cargosPorId = new Map(cargos.map((c) => [c.id, c]));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = empresa.razonSocial;
    workbook.created = data.generadoEn;

    const sheet = workbook.addWorksheet("Resumen de cuenta");
    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 30;
    sheet.getColumn(4).width = 16;
    sheet.getColumn(5).width = 16;

    sheet.mergeCells(1, 1, 1, 5);
    sheet.getCell(1, 1).value = `Resumen de cuenta — ${empresa.razonSocial}`;
    sheet.getCell(1, 1).font = { bold: true, size: 14 };

    sheet.mergeCells(2, 1, 2, 5);
    sheet.getCell(2, 1).value = nombreCliente(cliente);
    sheet.getCell(2, 1).font = { bold: true };

    sheet.mergeCells(3, 1, 3, 5);
    sheet.getCell(3, 1).value = `Generado: ${formatearFechaUTC(data.generadoEn)}`;
    sheet.getCell(3, 1).font = { italic: true, size: 9 };

    const saldoHeaderRow = sheet.addRow(["Saldo vencido", "Por vencer", "Saldo total", "A favor"]);
    saldoHeaderRow.font = { bold: true };
    const saldoValoresRow = sheet.addRow([
      saldo.saldoVencido,
      saldo.saldoPorVencer,
      saldo.saldoTotal,
      saldo.saldoAFavor,
    ]);
    saldoValoresRow.font = { size: 12 };
    [1, 2, 3, 4].forEach((col) => {
      saldoValoresRow.getCell(col).numFmt = '"$" #,##0.00';
    });

    sheet.addRow([]);

    const headerRow = sheet.addRow(["Fecha", "Tipo", "Detalle", "Monto", "Saldo"]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E5E5" } };
      cell.border = { bottom: { style: "thin" } };
    });

    if (movimientos.length === 0) {
      sheet.mergeCells(sheet.rowCount + 1, 1, sheet.rowCount + 1, 5);
      sheet.getCell(sheet.rowCount, 1).value = "Sin movimientos todavía.";
    }

    for (const movimiento of movimientos) {
      const lineasDetalle = construirLineasDetalleMovimiento(movimiento, boletasPorId, cargosPorId);
      const signo = movimiento.tipo === TipoMovimientoCuentaCorriente.COBRO ? -1 : 1;
      const row = sheet.addRow([
        formatearFechaUTC(movimiento.fecha),
        TIPO_MOVIMIENTO_LABELS[movimiento.tipo],
        lineasDetalle.join("\n"),
        signo * movimiento.monto,
        movimiento.saldoCorriente,
      ]);
      row.getCell(3).alignment = { wrapText: true, vertical: "top" };
      // Estimación de renglones visuales: cada entrada de `lineasDetalle` es
      // un `\n`, pero además puede envolver dentro del ancho de la columna
      // (~30 caracteres) — se suma esa envoltura para no dejar el texto
      // recortado en Excel/LibreOffice (que no recalculan el alto solos).
      const CHARS_POR_LINEA = 32;
      const totalSubrenglones = lineasDetalle.reduce(
        (acc, linea) => acc + Math.max(1, Math.ceil(linea.length / CHARS_POR_LINEA)),
        0,
      );
      if (totalSubrenglones > 1) {
        row.height = totalSubrenglones * 14;
      }
      row.getCell(4).numFmt = '"$" #,##0.00';
      row.getCell(5).numFmt = '"$" #,##0.00';
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
