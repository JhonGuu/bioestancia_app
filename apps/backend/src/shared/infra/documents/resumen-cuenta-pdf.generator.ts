import PDFDocument from "pdfkit";
import { injectable } from "inversify";

import { ResumenCuentaData } from "@/modules/cuenta-corriente/domain/resumen-cuenta";
import { TipoMovimientoCuentaCorriente } from "@/modules/cuenta-corriente/domain/movimiento-cuenta-corriente";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { drawPdfTable, type PdfTableColumn, type PdfTableRow } from "@/shared/infra/documents/pdf-table.util";
import { formatearFechaUTC, formatearMoneda } from "@/shared/infra/documents/formato.util";
import { logoParaEmpresa } from "@/shared/infra/documents/brand-logo.util";
import { PDF_COLORS, brandColorParaEmpresa } from "@/shared/infra/documents/pdf-theme.util";
import { construirLineasDetalleMovimiento, colorParaMovimiento } from "@/shared/infra/documents/detalle-movimiento-texto.util";

const TIPO_MOVIMIENTO_LABELS: Record<TipoMovimientoCuentaCorriente, string> = {
  [TipoMovimientoCuentaCorriente.BOLETA]: "Boleta",
  [TipoMovimientoCuentaCorriente.COBRO]: "Cobro",
  [TipoMovimientoCuentaCorriente.CARGO]: "Cargo",
};

/**
 * Genera el PDF del resumen de cuenta de un cliente: encabezado con color de
 * marca (logo + datos de la empresa) + tarjetas de saldo (vencido/por
 * vencer/total/a favor, coloreadas cuando corresponde) + referencia de
 * colores + la línea de tiempo completa de boletas, cobros y cargos, con
 * cada fila coloreada según su tipo (ver `colorParaMovimiento`) — la misma
 * hoja de cuenta corriente que ya usa la empresa, pero generada.
 */
@injectable()
export class ResumenCuentaPdfGenerator {
  async generate(data: ResumenCuentaData): Promise<Buffer> {
    const { cliente, empresa, saldo, movimientos, boletas, cargos } = data;
    const boletasPorId = new Map(boletas.map((b) => [b.id, b]));
    const cargosPorId = new Map(cargos.map((c) => [c.id, c]));
    const brandColor = brandColorParaEmpresa(empresa.razonSocial);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const fullWidth = pageRight - pageLeft;

    // ── Encabezado: logo (si hay) + razón social a la izquierda, título +
    // cliente + fecha de generación a la derecha, todo sobre una franja
    // superior fina del color de marca.
    doc.rect(pageLeft, 40, fullWidth, 3).fill(brandColor);

    const logo = logoParaEmpresa(empresa.razonSocial);
    // El isotipo de El Meridiano es una "chapa" más cuadrada (no un
    // wordmark alargado como el de Bioestancia) — al mismo ancho se ve más
    // chico, así que necesita más ancho para tener presencia similar (mismo
    // criterio que en `boleta-pdf.generator.ts`).
    const esElMeridiano = empresa.razonSocial.toLowerCase().includes("meridiano");
    const logoWidth = esElMeridiano ? 120 : 90;
    let leftY = 52;
    if (logo) {
      doc.image(logo.path, pageLeft, leftY, { width: logoWidth });
      leftY += logoWidth / logo.aspectRatio + 6;
    }
    doc.fillColor(PDF_COLORS.text).font("Helvetica-Bold").fontSize(11).text(empresa.razonSocial, pageLeft, leftY, {
      width: 220,
    });

    doc
      .fillColor(brandColor)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Resumen de cuenta", pageLeft, 50, { width: fullWidth, align: "right" });
    doc
      .fillColor(PDF_COLORS.text)
      .font("Helvetica")
      .fontSize(11)
      .text(nombreCliente(cliente), pageLeft, 74, { width: fullWidth, align: "right" });
    doc
      .fillColor(PDF_COLORS.textMuted)
      .font("Helvetica")
      .fontSize(9)
      .text(`Generado: ${formatearFechaUTC(data.generadoEn)}`, pageLeft, 90, {
        width: fullWidth,
        align: "right",
      });

    let y = 140;

    // ── Saldo: 4 tarjetas lado a lado — chip de color cuando el número amerita atención.
    const cardGap = 8;
    const cardWidth = (fullWidth - cardGap * 3) / 4;
    const saldoItems: { label: string; valor: number; color: string | null }[] = [
      { label: "Saldo vencido", valor: saldo.saldoVencido, color: saldo.saldoVencido > 0 ? PDF_COLORS.rechazo : null },
      { label: "Por vencer", valor: saldo.saldoPorVencer, color: null },
      { label: "Saldo total", valor: saldo.saldoTotal, color: brandColor },
      { label: "A favor", valor: saldo.saldoAFavor, color: saldo.saldoAFavor > 0 ? PDF_COLORS.cobro : null },
    ];
    const cardHeight = 46;
    saldoItems.forEach((item, index) => {
      const x = pageLeft + (cardWidth + cardGap) * index;
      doc.roundedRect(x, y, cardWidth, cardHeight, 4).fill(PDF_COLORS.headerBg);
      if (item.color) {
        doc.rect(x, y, 3, cardHeight).fill(item.color);
      }
      doc
        .fillColor(PDF_COLORS.textMuted)
        .font("Helvetica")
        .fontSize(8)
        .text(item.label, x + 10, y + 8, { width: cardWidth - 16 });
      doc
        .fillColor(item.color ?? PDF_COLORS.text)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(formatearMoneda(item.valor), x + 10, y + 22, { width: cardWidth - 16 });
    });
    y += cardHeight + 20;

    // ── Movimientos.
    if (movimientos.length === 0) {
      doc.fillColor(PDF_COLORS.textMuted).font("Helvetica").fontSize(10).text("Sin movimientos todavía.", pageLeft, y);
      doc.end();
      return done;
    }

    // ── Referencia de colores — para que el color de cada fila se entienda sin adivinar.
    const referencia: { color: string; label: string }[] = [
      { color: PDF_COLORS.cobro, label: "Cobro" },
      { color: PDF_COLORS.cargo, label: "Cargo (recargo/comisión)" },
      { color: PDF_COLORS.rechazo, label: "Cheque rechazado" },
      { color: PDF_COLORS.compensacion, label: "Compensación de kg" },
    ];
    let refX = pageLeft;
    doc.font("Helvetica").fontSize(8);
    for (const item of referencia) {
      doc.rect(refX, y + 2, 8, 8).fill(item.color);
      doc.fillColor(PDF_COLORS.textMuted).text(item.label, refX + 12, y, { width: 140 });
      refX += 150;
    }
    y += 20;

    const columns: PdfTableColumn[] = [
      { header: "Fecha", width: 65 },
      { header: "Tipo", width: 55 },
      { header: "Detalle", width: 195 },
      { header: "Monto", width: 90, align: "right" },
      { header: "Saldo", width: 90, align: "right" },
    ];

    const rows: PdfTableRow[] = movimientos.map((movimiento) => {
      const lineasDetalle = construirLineasDetalleMovimiento(movimiento, boletasPorId, cargosPorId);
      const detalle = lineasDetalle.join("\n");
      // Un cobro siempre resta saldo; una boleta/cargo normalmente suma, pero
      // una compensación de kg en contra del cliente (monto negativo)
      // también resta — el signo mostrado sigue el efecto real, no el tipo
      // (mismo criterio que el frontend, `movimientos-cuenta-corriente-list.tsx`).
      const efecto = movimiento.tipo === TipoMovimientoCuentaCorriente.COBRO ? -movimiento.monto : movimiento.monto;
      const signo = efecto < 0 ? "-" : "+";
      const color = colorParaMovimiento(movimiento, cargosPorId);
      return {
        cells: [
          formatearFechaUTC(movimiento.fecha),
          TIPO_MOVIMIENTO_LABELS[movimiento.tipo],
          detalle,
          `${signo}${formatearMoneda(Math.abs(movimiento.monto))}`,
          formatearMoneda(movimiento.saldoCorriente),
        ],
        background: color.background ?? undefined,
        textColor: color.accentColor ?? undefined,
        accentColor: color.accentColor ?? undefined,
      };
    });

    drawPdfTable(doc, {
      columns,
      rows,
      startX: pageLeft,
      startY: y,
      pageBottom,
      headerAccentColor: brandColor,
    });

    doc.end();
    return done;
  }
}
