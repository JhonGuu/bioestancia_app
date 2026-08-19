import PDFDocument from "pdfkit";
import { injectable } from "inversify";

import { ReporteDiarioData } from "@/modules/boletas/domain/reporte-diario";
import { nombreCliente } from "@/modules/clientes/domain/cliente";
import { compraNumeroYLetra } from "@/modules/compras/domain/compra";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { detalleVenta } from "@/modules/ventas/domain/forma-venta-labels";
import { drawPdfTable, type PdfTableColumn, type PdfTableRow } from "@/shared/infra/documents/pdf-table.util";
import { formatearFechaUTC, formatearKg, formatearMoneda } from "@/shared/infra/documents/formato.util";
import { PDF_COLORS, brandColorParaEmpresa } from "@/shared/infra/documents/pdf-theme.util";

/**
 * Genera el PDF del reporte diario: un bloque por cliente (nombre + un
 * sub-cuadro por CADA boleta que tuvo ese día, con "Boleta N° X" como título
 * arriba en vez de una columna repetida en cada fila — lo normal es una sola
 * boleta por cliente/día, pero si tuvo más de una quedan bien separadas) +
 * subtotal del cliente, y un total general al final. Mismo criterio de
 * detalle y colores que el PDF de una boleta individual (compensación de kg
 * resaltada, ítems pendientes de precio en color de "cargo"), pero de todos
 * los clientes del día juntos — ver `ObtenerReporteDiarioData`.
 */
@injectable()
export class ReporteDiarioPdfGenerator {
  async generate(data: ReporteDiarioData): Promise<Buffer> {
    const brandColor = brandColorParaEmpresa(data.empresa.razonSocial);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const fullWidth = pageRight - pageLeft;

    doc.rect(pageLeft, 40, fullWidth, 3).fill(brandColor);
    doc
      .fillColor(PDF_COLORS.text)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(`Reporte diario — ${data.empresa.razonSocial}`, pageLeft, 52);
    doc.fillColor(PDF_COLORS.textMuted).font("Helvetica").fontSize(11).text(formatearFechaUTC(data.fecha), pageLeft, 74);

    let y = 105;

    if (data.grupos.length === 0) {
      doc.fillColor(PDF_COLORS.textMuted).font("Helvetica").fontSize(11).text("No hay boletas cargadas para este día.", pageLeft, y);
      doc.end();
      return done;
    }

    const comprasPorId = new Map(data.compras.map((c) => [c.id, c]));

    // Sin columna "Boleta" — el número de boleta va como título arriba de
    // cada sub-cuadro (ver el loop de `grupo.items` abajo), no repetido en
    // cada fila.
    const columns: PdfTableColumn[] = [
      { header: "Tropa", width: 65 },
      { header: "Garrón", width: 55 },
      { header: "Detalle", width: 195 },
      { header: "Cantidad (Kg)", width: 90, align: "right" },
      { header: "Importe ($)", width: 100, align: "right" },
    ];

    for (const grupo of data.grupos) {
      // Nombre del cliente + espacio para al menos el título de la primera
      // boleta — si no entra, arranca el bloque en una página nueva.
      if (y + 50 > pageBottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      doc.fillColor(PDF_COLORS.text).font("Helvetica-Bold").fontSize(12).text(nombreCliente(grupo.cliente), pageLeft, y);
      y += 18;

      // Un sub-cuadro por boleta (lo normal es una sola por cliente/día,
      // pero el dominio no lo prohíbe — ver comentario en `boleta.ts`).
      for (const item of grupo.items) {
        const numeroBoleta = item.boleta.numero ?? item.boleta.id.slice(0, 8);

        if (y + 40 > pageBottom) {
          doc.addPage();
          y = doc.page.margins.top;
        }
        doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(10).text(`Boleta N° ${numeroBoleta}`, pageLeft, y);
        y += 14;

        let hayCompensacion = false;
        const rows: PdfTableRow[] = item.ventas.map((venta) => {
          const compra = venta.compraId ? comprasPorId.get(venta.compraId) : undefined;
          const esCompensacion = venta.formaVenta === FormaVenta.COMPENSACION_KG;
          if (esCompensacion) hayCompensacion = true;
          return {
            cells: [
              compra ? compraNumeroYLetra(compra) : "—",
              venta.garron !== null ? String(venta.garron) : "",
              detalleVenta(venta.formaVenta, venta.categoria),
              formatearKg(venta.kg),
              venta.total !== null ? formatearMoneda(venta.total) : "",
            ],
            background: esCompensacion ? PDF_COLORS.compensacionBg : undefined,
            textColor: esCompensacion ? PDF_COLORS.compensacion : undefined,
            accentColor: esCompensacion ? PDF_COLORS.compensacion : undefined,
          };
        });

        y = drawPdfTable(doc, { columns, rows, startX: pageLeft, startY: y, pageBottom, headerAccentColor: brandColor });
        if (hayCompensacion) {
          doc.font("Helvetica").fontSize(7).fillColor(PDF_COLORS.compensacion).text("incluye compensación de kg", pageLeft, y + 2);
          y += 10;
        }
        y += 10;
      }

      y -= 6;
      if (y + 16 > pageBottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      const notaPendientes =
        grupo.pendientesDePrecio > 0
          ? ` (${grupo.pendientesDePrecio} ítem${grupo.pendientesDePrecio === 1 ? "" : "s"} pendiente${grupo.pendientesDePrecio === 1 ? "" : "s"} de precio)`
          : "";
      doc
        .fillColor(grupo.pendientesDePrecio > 0 ? PDF_COLORS.cargo : PDF_COLORS.text)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          `Subtotal: ${formatearKg(grupo.totalKg)} Kg — ${formatearMoneda(grupo.totalImporte)}${notaPendientes}`,
          pageLeft,
          y,
          { width: fullWidth, align: "right" },
        );
      y += 26;
    }

    if (y + 50 > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    doc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor(brandColor).lineWidth(1.5).stroke();
    y += 10;
    const notaGeneral =
      data.totalPendientesDePrecio > 0
        ? ` (${data.totalPendientesDePrecio} ítem${data.totalPendientesDePrecio === 1 ? "" : "s"} pendiente${data.totalPendientesDePrecio === 1 ? "" : "s"} de precio)`
        : "";
    doc
      .fillColor(brandColor)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(
        `Total general: ${formatearKg(data.totalGeneralKg)} Kg — ${formatearMoneda(data.totalGeneralImporte)}${notaGeneral}`,
        pageLeft,
        y,
        { width: fullWidth, align: "right" },
      );
    y += 30;

    // Stock teórico de cada tropa abierta (compradas − vendidas) — para
    // chequear lo que se entregó contra lo que queda por repartir (ver
    // `ObtenerStockTropas`). "Restante" en rojo si quedó en negativo (se
    // vendió de más). No se muestra si no hay tropas abiertas.
    if (data.stockTropas.length > 0) {
      if (y + 40 > pageBottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      doc.fillColor(PDF_COLORS.text).font("Helvetica-Bold").fontSize(12).text("Stock de tropas (teórico)", pageLeft, y);
      y += 18;

      const stockColumns: PdfTableColumn[] = [
        { header: "Tropa", width: 120 },
        { header: "Compradas", width: 120, align: "right" },
        { header: "Vendidas", width: 120, align: "right" },
        { header: "Restante", width: 145, align: "right" },
      ];
      const stockRows: PdfTableRow[] = data.stockTropas.map((tropa) => {
        const negativo = tropa.stockRestante < 0;
        return {
          cells: [
            compraNumeroYLetra(tropa),
            String(tropa.cabezasCompradas),
            String(tropa.cabezasVendidas),
            String(tropa.stockRestante),
          ],
          background: negativo ? PDF_COLORS.rechazoBg : undefined,
          textColor: negativo ? PDF_COLORS.rechazo : undefined,
          accentColor: negativo ? PDF_COLORS.rechazo : undefined,
        };
      });
      y = drawPdfTable(doc, {
        columns: stockColumns,
        rows: stockRows,
        startX: pageLeft,
        startY: y,
        pageBottom,
        headerAccentColor: brandColor,
      });
    }

    doc.end();
    return done;
  }
}
