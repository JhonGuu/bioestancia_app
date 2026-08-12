import PDFDocument from "pdfkit";
import { injectable } from "inversify";

import { ResumenCuentaData } from "@/modules/cuenta-corriente/domain/resumen-cuenta";
import { TipoMovimientoCuentaCorriente } from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { TIPO_CARGO_LABELS } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { drawPdfTable, type PdfTableColumn } from "@/shared/infra/documents/pdf-table.util";
import { formatearFechaUTC, formatearMoneda } from "@/shared/infra/documents/formato.util";
import { logoParaEmpresa } from "@/shared/infra/documents/brand-logo.util";

const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimientoCuentaCorriente, string> = {
  [TipoMovimientoCuentaCorriente.BOLETA]: "Boleta",
  [TipoMovimientoCuentaCorriente.COBRO]: "Cobro",
  [TipoMovimientoCuentaCorriente.CARGO]: "Cargo",
};

/**
 * Genera el PDF del resumen de cuenta de un cliente: encabezado (logo +
 * datos de la empresa) + saldo (vencido/por vencer/total/a favor) + la
 * línea de tiempo completa de boletas, cobros y cargos — la misma hoja de
 * cuenta corriente que ya usa la empresa, pero generada.
 */
@injectable()
export class ResumenCuentaPdfGenerator {
  async generate(data: ResumenCuentaData): Promise<Buffer> {
    const { cliente, empresa, saldo, movimientos, boletas, cargos } = data;
    const boletasPorId = new Map(boletas.map((b) => [b.id, b]));
    const cargosPorId = new Map(cargos.map((c) => [c.id, c]));

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const fullWidth = pageRight - pageLeft;

    // ── Encabezado: logo (si hay) + razón social a la izquierda, título +
    // cliente + fecha de generación a la derecha.
    const logo = logoParaEmpresa(empresa.razonSocial);
    const logoWidth = 90;
    let leftY = 40;
    if (logo) {
      doc.image(logo.path, pageLeft, leftY, { width: logoWidth });
      leftY += logoWidth / logo.aspectRatio + 6;
    }
    doc.font("Helvetica-Bold").fontSize(11).text(empresa.razonSocial, pageLeft, leftY, { width: 220 });

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Resumen de cuenta", pageLeft, 40, { width: fullWidth, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(11)
      .text(nombreCliente(cliente), pageLeft, 62, { width: fullWidth, align: "right" });
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(`Generado: ${formatearFechaUTC(data.generadoEn)}`, pageLeft, 78, {
        width: fullWidth,
        align: "right",
      });

    let y = 130;

    // ── Saldo: 4 cifras lado a lado.
    const saldoWidth = fullWidth / 4;
    const saldoItems: [string, number][] = [
      ["Saldo vencido", saldo.saldoVencido],
      ["Por vencer", saldo.saldoPorVencer],
      ["Saldo total", saldo.saldoTotal],
      ["A favor", saldo.saldoAFavor],
    ];
    saldoItems.forEach(([label, valor], index) => {
      const x = pageLeft + saldoWidth * index;
      doc.font("Helvetica").fontSize(9).text(label, x, y, { width: saldoWidth });
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(formatearMoneda(valor), x, y + 13, { width: saldoWidth });
    });
    y += 45;
    doc.moveTo(pageLeft, y).lineTo(pageRight, y).stroke();
    y += 16;

    // ── Movimientos.
    if (movimientos.length === 0) {
      doc.font("Helvetica").fontSize(10).text("Sin movimientos todavía.", pageLeft, y);
      doc.end();
      return done;
    }

    const columns: PdfTableColumn[] = [
      { header: "Fecha", width: 65 },
      { header: "Tipo", width: 55 },
      { header: "Detalle", width: 195 },
      { header: "Monto", width: 90, align: "right" },
      { header: "Saldo", width: 90, align: "right" },
    ];

    const rows = movimientos.map((movimiento) => {
      let detalle = "Cobro";
      if (movimiento.tipo === TipoMovimientoCuentaCorriente.BOLETA && movimiento.boletaId) {
        const boleta = boletasPorId.get(movimiento.boletaId);
        detalle = `Boleta ${boleta?.numero ?? "s/n"}`;
      } else if (movimiento.tipo === TipoMovimientoCuentaCorriente.CARGO && movimiento.cargoId) {
        const cargo = cargosPorId.get(movimiento.cargoId);
        detalle = cargo ? TIPO_CARGO_LABELS[cargo.tipo] : "Cargo";
      }
      const signo = movimiento.tipo === TipoMovimientoCuentaCorriente.COBRO ? "-" : "+";
      return [
        formatearFechaUTC(movimiento.fecha),
        TIPO_MOVIMIENTO_LABELS[movimiento.tipo],
        detalle,
        `${signo}${formatearMoneda(movimiento.monto)}`,
        formatearMoneda(movimiento.saldoCorriente),
      ];
    });

    drawPdfTable(doc, { columns, rows, startX: pageLeft, startY: y, pageBottom });

    doc.end();
    return done;
  }
}
