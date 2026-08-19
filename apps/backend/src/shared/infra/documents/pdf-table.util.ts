import { PDF_COLORS } from "@/shared/infra/documents/pdf-theme.util";

export interface PdfTableColumn {
  header: string;
  width: number;
  align?: "left" | "right" | "center";
}

export interface PdfTableRow {
  cells: string[];
  /** Fondo de toda la fila — si falta, se usa zebra striping automático (ver `zebra`). */
  background?: string;
  /** Color de texto de toda la fila (default `PDF_COLORS.text`). */
  textColor?: string;
  /** Barra vertical de 3pt a la izquierda de la fila — para marcar de un vistazo el tipo de movimiento (cobro/cargo/rechazo/compensación). */
  accentColor?: string;
  /** Alto puntual — si falta, se calcula solo según cuánto ocupa el texto más largo de la fila (ver `heightOfString`). */
  height?: number;
}

export interface DrawPdfTableOptions {
  columns: PdfTableColumn[];
  rows: PdfTableRow[];
  startX: number;
  startY: number;
  /** Y máximo utilizable de la página (`doc.page.height - doc.page.margins.bottom`) — dispara salto de página. */
  pageBottom: number;
  /** Alto MÍNIMO de una fila (default 20) — el alto real puede ser mayor si el contenido lo necesita. */
  rowHeight?: number;
  headerHeight?: number;
  fontSize?: number;
  /** Alterna un fondo gris muy clarito en las filas sin `background` propio (default `true`). */
  zebra?: boolean;
  /** Color de fondo del header (default `PDF_COLORS.headerBg`). */
  headerBackground?: string;
  /** Color de texto del header (default `PDF_COLORS.headerText`). */
  headerTextColor?: string;
  /** Color de la línea de 2pt debajo del header — pensado para el color de marca de la empresa (default `PDF_COLORS.border`). */
  headerAccentColor?: string;
}

const ACCENT_WIDTH = 3;
const CELL_PADDING_X = 6;
const ROW_VERTICAL_PADDING = 8;

/**
 * Dibuja una tabla "de reporte" (sin grilla completa) — header con fondo
 * claro + línea de acento debajo, filas con separador horizontal fino,
 * zebra striping automático, y una barra de color opcional a la izquierda
 * de cada fila para marcar su tipo (cobro/cargo/rechazo/compensación, según
 * lo decida cada generador). El alto de cada fila se calcula solo a partir
 * del texto más largo (soporta celdas multilínea con `\n`), así que ningún
 * generador tiene que estimarlo a mano. Si una fila no entra en lo que
 * queda de página, agrega una página nueva y repite el header ahí. Devuelve
 * la posición Y final (para poder seguir escribiendo debajo, ej. un total).
 */
export function drawPdfTable(doc: PDFKit.PDFDocument, options: DrawPdfTableOptions): number {
  const { columns, rows, startX, pageBottom } = options;
  const minRowHeight = options.rowHeight ?? 20;
  const headerHeight = options.headerHeight ?? 24;
  const fontSize = options.fontSize ?? 9;
  const zebra = options.zebra ?? true;
  const headerBackground = options.headerBackground ?? PDF_COLORS.headerBg;
  const headerTextColor = options.headerTextColor ?? PDF_COLORS.headerText;
  const headerAccentColor = options.headerAccentColor ?? PDF_COLORS.border;
  const totalWidth = columns.reduce((acc, c) => acc + c.width, 0);

  let y = options.startY;

  function drawHeader(): void {
    doc.rect(startX, y, totalWidth, headerHeight).fill(headerBackground);
    let x = startX;
    doc.font("Helvetica-Bold").fontSize(fontSize).fillColor(headerTextColor);
    for (const col of columns) {
      doc.text(col.header, x + CELL_PADDING_X, y + headerHeight / 2 - fontSize / 2, {
        width: col.width - CELL_PADDING_X * 2,
        align: col.align ?? "left",
      });
      x += col.width;
    }
    y += headerHeight;
    doc.rect(startX, y - 2, totalWidth, 2).fill(headerAccentColor);
    doc.fillColor(PDF_COLORS.text).font("Helvetica").fontSize(fontSize);
  }

  function alturaFila(row: PdfTableRow): number {
    if (row.height) return row.height;
    doc.font("Helvetica").fontSize(fontSize);
    let maxHeight = 0;
    row.cells.forEach((cell, i) => {
      const col = columns[i];
      if (!col) return;
      const h = doc.heightOfString(cell, { width: col.width - CELL_PADDING_X * 2 });
      if (h > maxHeight) maxHeight = h;
    });
    return Math.max(minRowHeight, maxHeight + ROW_VERTICAL_PADDING);
  }

  drawHeader();

  rows.forEach((row, rowIndex) => {
    const thisRowHeight = alturaFila(row);
    if (y + thisRowHeight > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }

    const background = row.background ?? (zebra && rowIndex % 2 === 1 ? PDF_COLORS.zebra : null);
    if (background) {
      doc.rect(startX, y, totalWidth, thisRowHeight).fill(background);
    }
    if (row.accentColor) {
      doc.rect(startX, y, ACCENT_WIDTH, thisRowHeight).fill(row.accentColor);
    }

    let x = startX;
    doc.font("Helvetica").fontSize(fontSize).fillColor(row.textColor ?? PDF_COLORS.text);
    row.cells.forEach((cell, i) => {
      const col = columns[i];
      if (!col) return;
      doc.text(cell, x + CELL_PADDING_X, y + ROW_VERTICAL_PADDING / 2, {
        width: col.width - CELL_PADDING_X * 2,
        align: col.align ?? "left",
      });
      x += col.width;
    });

    doc
      .moveTo(startX, y + thisRowHeight)
      .lineTo(startX + totalWidth, y + thisRowHeight)
      .strokeColor(PDF_COLORS.border)
      .lineWidth(0.5)
      .stroke();

    y += thisRowHeight;
  });

  doc.fillColor(PDF_COLORS.text).strokeColor("black");
  return y;
}
