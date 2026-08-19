import PDFDocument from "pdfkit";
import { injectable } from "inversify";

import { Boleta } from "@/modules/boletas/domain/boleta";
import { Venta } from "@/modules/ventas/domain/venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { Cliente, nombreCliente } from "@/modules/clientes/domain/cliente";
import { Empresa } from "@/modules/empresas/domain/empresa";
import { Compra } from "@/modules/compras/domain/compra";
import { detalleVenta } from "@/modules/ventas/domain/forma-venta-labels";
import { drawPdfTable, type PdfTableColumn, type PdfTableRow } from "@/shared/infra/documents/pdf-table.util";
import { formatearFechaUTC, formatearKg, formatearMoneda } from "@/shared/infra/documents/formato.util";
import { logoParaEmpresa } from "@/shared/infra/documents/brand-logo.util";
import { PDF_COLORS, brandColorParaEmpresa } from "@/shared/infra/documents/pdf-theme.util";

export interface BoletaPdfInput {
  boleta: Boleta;
  ventas: Venta[];
  cliente: Cliente;
  empresa: Empresa;
  /** Compras (tropas) referenciadas por `ventas` — solo se usa `letra`, ver comentario abajo. */
  compras: Compra[];
}

/**
 * Genera el PDF de una boleta imitando el papel preimpreso de El Meridiano.
 *
 * Encabezado: un cuadro con bordes redondeados dividido en dos sectores por
 * un cuadrado con "X" (indicador de recibo, ver `dividerX` más abajo).
 * Sector izquierdo: logo (`logoParaEmpresa`) + razón social + cuit + teléfono
 * + dirección, apilados. Sector derecho: aviso "Documento no válido como
 * factura", N° de boleta (grande, negrita, con el color de marca) y fecha.
 * Debajo del cuadro va "Señor: <cliente>", y después la grilla
 * N°/Garrón/Detalle/Cantidad (Kg)/Importe ($) — una fila por venta, con las
 * filas de compensación de kg resaltadas (mismo color que en la cuenta
 * corriente — ver `pdf-theme.util.ts`). `Importe` queda vacío si esa venta
 * todavía no tiene precio cargado (`Venta.total === null`), igual que en el
 * papel (se completa a mano después).
 *
 * Sin columna "Letra": es un dato interno de la tropa que no se le muestra
 * al cliente en este documento (`compras` sigue viniendo en `BoletaPdfInput`
 * por si algún generador futuro la necesita, pero este no la usa).
 */
@injectable()
export class BoletaPdfGenerator {
  async generate(input: BoletaPdfInput): Promise<Buffer> {
    const { boleta, ventas, cliente, empresa } = input;
    const brandColor = brandColorParaEmpresa(empresa.razonSocial);

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(chunks))),
    );

    const pageLeft = doc.page.margins.left;
    const pageRight = doc.page.width - doc.page.margins.right;
    const pageBottom = doc.page.height - doc.page.margins.bottom;

    // ── Encabezado: cuadro con bordes redondeados, dividido en sector
    // izquierdo (logo + datos de la empresa) y derecho (N°/fecha) por un
    // cuadrado con "X" en el medio — imita el sello preimpreso del papel.
    const headerX = pageLeft;
    const headerY = 40;
    const headerWidth = pageRight - pageLeft;
    const padding = 12;

    const logo = logoParaEmpresa(empresa.razonSocial);
    // El isotipo de El Meridiano es una "chapa" más cuadrada (no un
    // wordmark alargado como el de Bioestancia) — al mismo ancho se ve más
    // chico, así que necesita más ancho para tener presencia similar.
    const esElMeridiano = empresa.razonSocial.toLowerCase().includes("meridiano");
    const logoWidth = esElMeridiano ? 135 : 100;
    const logoHeight = logo ? logoWidth / logo.aspectRatio : 0;

    // CUIT/teléfono/dirección son opcionales (`Empresa.telefono`/`direccion`,
    // se completan con `PATCH /empresas/:id` o vía `pnpm db:seed` — ver
    // README) — la línea correspondiente simplemente no se dibuja si faltan.
    const infoLines = [
      empresa.cuit ? `CUIT: ${empresa.cuit}` : null,
      empresa.telefono ? `Tel: ${empresa.telefono}` : null,
      empresa.direccion,
    ].filter((linea): linea is string => Boolean(linea));

    const leftTextHeight = (1 + infoLines.length) * 11; // razón social + cada línea de datos
    const leftContentHeight = (logo ? logoHeight + 6 : 0) + leftTextHeight;
    const rightContentHeight = 10 + 4 + 18 + 4 + 13; // aviso + N° + fecha, con sus gaps

    const headerHeight =
      padding * 2 + Math.max(leftContentHeight, rightContentHeight, 60);

    doc.roundedRect(headerX, headerY, headerWidth, headerHeight, 8).lineWidth(1.2).strokeColor(brandColor).stroke();

    // Cuadrado con "X" — el "indicador de recibo" que separa los dos
    // sectores, centrado en el recuadro (no corrido hacia el sector
    // izquierdo). Dos líneas negras lo conectan con el borde superior e
    // inferior del recuadro, como si lo estuvieran "colgando" del marco —
    // terminan de marcar la división entre los dos sectores.
    const dividerX = headerX + headerWidth / 2;
    const squareSize = 40;
    const squareX = dividerX - squareSize / 2;
    const squareY = headerY + headerHeight / 2 - squareSize / 2;
    doc
      .moveTo(dividerX, headerY)
      .lineTo(dividerX, squareY)
      .moveTo(dividerX, squareY + squareSize)
      .lineTo(dividerX, headerY + headerHeight)
      .strokeColor("black")
      .lineWidth(1)
      .stroke();
    doc.rect(squareX, squareY, squareSize, squareSize).strokeColor(brandColor).lineWidth(1.2).stroke();
    doc
      .fillColor(brandColor)
      .font("Helvetica-Bold")
      .fontSize(50)
      .text("X", squareX, squareY + 3, { width: squareSize, align: "center" });

    // Sector izquierdo: logo arriba, razón social / cuit / teléfono / dirección debajo.
    const leftX = headerX + padding;
    const leftWidth = dividerX - squareSize / 2 - 8 - leftX;
    let leftY = headerY + padding;

    if (logo) {
      doc.image(logo.path, leftX, leftY, { width: logoWidth });
      leftY += logoHeight + 6;
    }
    doc
      .fillColor(PDF_COLORS.text)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(empresa.razonSocial, leftX, leftY, { width: leftWidth });
    leftY += 11;
    doc.fillColor(PDF_COLORS.textMuted).font("Helvetica").fontSize(8);
    for (const linea of infoLines) {
      doc.text(linea, leftX, leftY, { width: leftWidth });
      leftY += 11;
    }

    // Sector derecho: aviso + N° de boleta (grande, color de marca) + fecha.
    const rightX = dividerX + squareSize / 2 + 8;
    const rightWidth = headerX + headerWidth - padding - rightX;
    let rightY = headerY + padding;

    doc
      .fillColor(PDF_COLORS.textMuted)
      .font("Helvetica")
      .fontSize(8)
      .text("Documento no válido como factura", rightX, rightY, {
        width: rightWidth,
        align: "right",
      });
    rightY += 14;
    doc
      .fillColor(brandColor)
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`N° ${boleta.numero ?? "—"}`, rightX, rightY, {
        width: rightWidth,
        align: "right",
      });
    rightY += 22;
    doc
      .fillColor(PDF_COLORS.text)
      .font("Helvetica")
      .fontSize(10)
      .text(`Fecha: ${formatearFechaUTC(boleta.fecha)}`, rightX, rightY, {
        width: rightWidth,
        align: "right",
      });

    // "Señor: <cliente>"
    let y = headerY + headerHeight + 20;
    doc
      .fillColor(PDF_COLORS.text)
      .font("Helvetica")
      .fontSize(11)
      .text(`Señor: ${nombreCliente(cliente)}`, pageLeft, y);
    y += 20;

    const columns: PdfTableColumn[] = [
      { header: "N°", width: 25 },
      { header: "Garrón", width: 55 },
      { header: "Detalle", width: 195 },
      { header: "Cantidad (Kg)", width: 90, align: "right" },
      { header: "Importe ($)", width: 100, align: "right" },
    ];

    let hayCompensacion = false;
    const rows: PdfTableRow[] = ventas.map((venta, index) => {
      const esCompensacion = venta.formaVenta === FormaVenta.COMPENSACION_KG;
      if (esCompensacion) hayCompensacion = true;
      return {
        cells: [
          String(index + 1),
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

    y = drawPdfTable(doc, {
      columns,
      rows,
      startX: pageLeft,
      startY: y,
      pageBottom,
      headerAccentColor: brandColor,
    });

    if (hayCompensacion) {
      y += 4;
      doc.font("Helvetica").fontSize(7.5).fillColor(PDF_COLORS.compensacion);
      doc.rect(pageLeft, y + 1, 7, 7).fill(PDF_COLORS.compensacion);
      doc.text("Compensación de kg", pageLeft + 11, y, { width: 200 });
    }

    y += 14;
    if (y + 40 > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    const totalKg = ventas.reduce((acc, v) => acc + v.kg, 0);
    const pendientesDePrecio = ventas.filter((v) => v.total === null).length;
    const totalImporte = ventas.reduce((acc, v) => acc + (v.total ?? 0), 0);

    doc
      .fillColor(PDF_COLORS.text)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total: ${formatearKg(totalKg)} Kg`, pageLeft, y, {
        width: pageRight - pageLeft,
        align: "right",
      });
    y += 16;
    if (pendientesDePrecio > 0) {
      doc
        .fillColor(PDF_COLORS.cargo)
        .font("Helvetica")
        .fontSize(9)
        .text(
          `Importe: ${formatearMoneda(totalImporte)} (${pendientesDePrecio} ítem${pendientesDePrecio === 1 ? "" : "s"} pendiente${pendientesDePrecio === 1 ? "" : "s"} de precio)`,
          pageLeft,
          y,
          { width: pageRight - pageLeft, align: "right" },
        );
    } else {
      doc
        .fillColor(brandColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Importe: ${formatearMoneda(totalImporte)}`, pageLeft, y, {
          width: pageRight - pageLeft,
          align: "right",
        });
    }

    if (boleta.comentarios) {
      y += 26;
      doc
        .fillColor(PDF_COLORS.textMuted)
        .font("Helvetica-Oblique")
        .fontSize(9)
        .text(`Comentarios: ${boleta.comentarios}`, pageLeft, y, {
          width: pageRight - pageLeft,
        });
    }

    doc.end();
    return done;
  }
}
