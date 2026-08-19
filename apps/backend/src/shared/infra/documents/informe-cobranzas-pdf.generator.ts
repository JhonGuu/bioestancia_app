import PDFDocument from "pdfkit";
import { injectable } from "inversify";

import { InformeCobranzas } from "@/modules/informe-cobranzas/domain/informe-cobranzas";
import { MEDIO_PAGO_LABELS } from "@/modules/cobros/domain/medio-pago";
import { drawPdfTable, type PdfTableColumn, type PdfTableRow } from "@/shared/infra/documents/pdf-table.util";
import { formatearFechaUTC, formatearMoneda } from "@/shared/infra/documents/formato.util";
import { logoParaEmpresa } from "@/shared/infra/documents/brand-logo.util";
import { PDF_COLORS, brandColorParaEmpresa } from "@/shared/infra/documents/pdf-theme.util";
import { esMedioPagoCheque, esMedioPagoTransferencia } from "@/modules/cobros/domain/medio-pago";
import type { LineaInformeCobranza } from "@/modules/informe-cobranzas/domain/informe-cobranzas";

/**
 * Genera el PDF del "informe de cobranzas": encabezado con color de marca
 * (logo + rango de fechas del informe) + tabla de totales por medio de pago
 * + la línea de tiempo completa de líneas de cobro de TODOS los clientes de
 * la empresa — pensado para que administración controle que todo lo cobrado
 * (efectivo, transferencias, cheques) esté completo. Mismo estilo visual que
 * `resumen-cuenta-pdf.generator.ts` (misma paleta y `drawPdfTable`).
 */
@injectable()
export class InformeCobranzasPdfGenerator {
  async generate(data: InformeCobranzas): Promise<Buffer> {
    const { empresa } = data;
    const brandColor = brandColorParaEmpresa(empresa.razonSocial);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const fullWidth = pageRight - pageLeft;

    // ── Encabezado: igual criterio que `resumen-cuenta-pdf.generator.ts`
    // (franja de marca + logo a la izquierda, título + subtítulo a la derecha).
    doc.rect(pageLeft, 40, fullWidth, 3).fill(brandColor);

    const logo = logoParaEmpresa(empresa.razonSocial);
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
      .text("Informe de cobranzas", pageLeft, 50, { width: fullWidth, align: "right" });

    const periodo =
      data.desde || data.hasta
        ? `${data.desde ? formatearFechaUTC(data.desde) : "…"} — ${data.hasta ? formatearFechaUTC(data.hasta) : "…"}`
        : "Todo el historial";
    const filtroMedio = data.medioPagoFiltrado ? ` · ${MEDIO_PAGO_LABELS[data.medioPagoFiltrado]}` : "";
    doc
      .fillColor(PDF_COLORS.text)
      .font("Helvetica")
      .fontSize(11)
      .text(`${periodo}${filtroMedio}`, pageLeft, 74, { width: fullWidth, align: "right" });
    doc
      .fillColor(PDF_COLORS.textMuted)
      .font("Helvetica")
      .fontSize(9)
      .text(`Generado: ${formatearFechaUTC(data.generadoEn)}`, pageLeft, 90, {
        width: fullWidth,
        align: "right",
      });

    let y = 140;

    // ── Totales por medio de pago: una "tarjeta" chica por medio presente + una final de total general.
    const cardGap = 8;
    const cardsPorFila = Math.min(4, Math.max(1, data.totalesPorMedioPago.length + 1));
    const cardWidth = (fullWidth - cardGap * (cardsPorFila - 1)) / cardsPorFila;
    const cardHeight = 46;
    const tarjetas = [
      ...data.totalesPorMedioPago.map((t) => ({
        label: `${MEDIO_PAGO_LABELS[t.medioPago]} (${t.cantidad})`,
        valor: t.total,
        color: null as string | null,
      })),
      { label: `Total general (${data.lineas.length})`, valor: data.totalGeneral, color: brandColor },
    ];
    tarjetas.forEach((tarjeta, index) => {
      const fila = Math.floor(index / cardsPorFila);
      const columna = index % cardsPorFila;
      const x = pageLeft + (cardWidth + cardGap) * columna;
      const cardY = y + fila * (cardHeight + cardGap);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 4).fill(PDF_COLORS.headerBg);
      if (tarjeta.color) {
        doc.rect(x, cardY, 3, cardHeight).fill(tarjeta.color);
      }
      doc
        .fillColor(PDF_COLORS.textMuted)
        .font("Helvetica")
        .fontSize(8)
        .text(tarjeta.label, x + 10, cardY + 8, { width: cardWidth - 16 });
      doc
        .fillColor(tarjeta.color ?? PDF_COLORS.text)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(formatearMoneda(tarjeta.valor), x + 10, cardY + 22, { width: cardWidth - 16 });
    });
    const filasDeTarjetas = Math.ceil(tarjetas.length / cardsPorFila);
    y += filasDeTarjetas * (cardHeight + cardGap) + 10;

    // ── Línea de tiempo de líneas de cobro.
    if (data.lineas.length === 0) {
      doc
        .fillColor(PDF_COLORS.textMuted)
        .font("Helvetica")
        .fontSize(10)
        .text("Sin cobros en el período seleccionado.", pageLeft, y);
      doc.end();
      return done;
    }

    const columns: PdfTableColumn[] = [
      { header: "Fecha", width: 60 },
      { header: "Cliente", width: 140 },
      { header: "Medio de pago", width: 90 },
      { header: "Detalle", width: 105 },
      { header: "Monto", width: 65, align: "right" },
    ];

    const rows: PdfTableRow[] = data.lineas.map((linea) => ({
      cells: [
        formatearFechaUTC(linea.fecha),
        linea.clienteNombre,
        MEDIO_PAGO_LABELS[linea.medioPago] ?? linea.medioPago,
        detalleLinea(linea),
        formatearMoneda(linea.monto),
      ],
    }));

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

/**
 * Columna "Detalle" de la tabla — SIN el medio de pago (ya tiene su propia
 * columna): número de cheque para CHEQUE/ECHEQ, banco/billetera + remitente
 * para transferencias, o "—" si no hay nada más que mostrar.
 */
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
