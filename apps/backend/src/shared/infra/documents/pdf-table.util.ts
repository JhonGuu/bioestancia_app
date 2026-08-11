export interface PdfTableColumn {
  header: string;
  width: number;
  align?: "left" | "right" | "center";
}

export interface DrawPdfTableOptions {
  columns: PdfTableColumn[];
  rows: string[][];
  startX: number;
  startY: number;
  /** Y máximo utilizable de la página (`doc.page.height - doc.page.margins.bottom`) — dispara salto de página. */
  pageBottom: number;
  rowHeight?: number;
  headerHeight?: number;
  fontSize?: number;
}

/**
 * Dibuja una tabla con bordes a mano (pdfkit no trae tablas) — rectángulos +
 * texto por celda, imitando la grilla de la boleta de papel. Si una fila no
 * entra en lo que queda de página, agrega una página nueva y repite el
 * header ahí. Devuelve la posición Y final (para poder seguir escribiendo
 * debajo, ej. una fila de totales).
 */
export function drawPdfTable(doc: PDFKit.PDFDocument, options: DrawPdfTableOptions): number {
  const { columns, rows, startX, pageBottom } = options;
  const rowHeight = options.rowHeight ?? 20;
  const headerHeight = options.headerHeight ?? 22;
  const fontSize = options.fontSize ?? 9;
  const totalWidth = columns.reduce((acc, c) => acc + c.width, 0);

  let y = options.startY;

  function drawHeader(): void {
    let x = startX;
    doc.font("Helvetica-Bold").fontSize(fontSize);
    doc.rect(startX, y, totalWidth, headerHeight).stroke();
    for (const col of columns) {
      doc.text(col.header, x + 4, y + 6, { width: col.width - 8, align: col.align ?? "left" });
      if (x !== startX) doc.moveTo(x, y).lineTo(x, y + headerHeight).stroke();
      x += col.width;
    }
    y += headerHeight;
    doc.font("Helvetica").fontSize(fontSize);
  }

  drawHeader();

  for (const row of rows) {
    if (y + rowHeight > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }
    let x = startX;
    doc.rect(startX, y, totalWidth, rowHeight).stroke();
    row.forEach((cell, i) => {
      const col = columns[i];
      if (!col) return;
      doc.text(cell, x + 4, y + 5, { width: col.width - 8, align: col.align ?? "left" });
      if (x !== startX) doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
      x += col.width;
    });
    y += rowHeight;
  }

  return y;
}
