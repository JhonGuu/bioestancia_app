import PDFDocument from "pdfkit";
import { injectable } from "inversify";

import { RepartoDiario } from "@/modules/planificacion-cabezas/domain/reparto-diario";
import { PDF_COLORS, brandColorParaEmpresa } from "@/shared/infra/documents/pdf-theme.util";

/**
 * PDF del reparto de un día, pensado para mandarse por WhatsApp y leerse en
 * el celular: página ANGOSTA (360pt, ~127mm) y tan alta como haga falta —
 * una sola "hoja" continua, sin cortes de página — con letra grande. Mismo
 * contenido que el mensaje que hoy se arma a mano:
 *
 *   REPARTO – EL MERIDIANO
 *   Miércoles 23/09/2026
 *   10 cabezas – Aníbal
 *   8 cabezas – Emiliano Peralta   (seleccionar lindas, ~45 kg la media)
 *   ...
 *   NO LLEVAN: Ramírez, Moyano
 *
 * Como la altura depende del contenido y `PDFDocument` la necesita al
 * crearse, se dibuja dos veces con la misma función: una sobre un documento
 * descartable para medir, y otra sobre el real con la altura exacta.
 */

const ANCHO = 360;
const MARGEN = 24;
const ANCHO_UTIL = ANCHO - MARGEN * 2;

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** "2026-09-23" → "Miércoles 23/09/2026" (calendario UTC, igual que el resto del dominio). */
function fechaLarga(claveDia: string): string {
  const [anio, mes, dia] = claveDia.split("-").map(Number);
  const nombreDia = DIAS[new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()];
  return `${nombreDia} ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`;
}

function textoCabezas(cabezas: number): string {
  return `${cabezas} ${cabezas === 1 ? "cabeza" : "cabezas"}`;
}

@injectable()
export class RepartoDiarioPdfGenerator {
  async generate(data: RepartoDiario): Promise<Buffer> {
    const medidor = new PDFDocument({ size: [ANCHO, 20000], margin: 0 });
    const alto = Math.ceil(this.dibujar(medidor, data)) + MARGEN;

    const doc = new PDFDocument({
      size: [ANCHO, Math.max(alto, 200)],
      margin: 0,
      info: {
        Title: `Reparto ${data.empresa.razonSocial} ${data.fecha}`,
        Author: data.empresa.razonSocial,
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    this.dibujar(doc, data);
    doc.end();
    return done;
  }

  /** Dibuja todo el reparto y devuelve la coordenada Y donde termina. */
  private dibujar(doc: PDFKit.PDFDocument, data: RepartoDiario): number {
    const brandColor = brandColorParaEmpresa(data.empresa.razonSocial);

    doc.rect(0, 0, ANCHO, 6).fill(brandColor);

    let y = 26;
    doc
      .fillColor(PDF_COLORS.headerText)
      .font("Helvetica-Bold")
      .fontSize(19)
      .text(`REPARTO – ${data.empresa.razonSocial.toUpperCase()}`, MARGEN, y, { width: ANCHO_UTIL });
    y = doc.y + 6;

    doc
      .fillColor(brandColor)
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(fechaLarga(data.fecha), MARGEN, y, { width: ANCHO_UTIL });
    y = doc.y + 14;

    if (data.lineas.length === 0) {
      doc
        .fillColor(PDF_COLORS.textMuted)
        .font("Helvetica-Oblique")
        .fontSize(13)
        .text("No hay cabezas planificadas para este día.", MARGEN, y, { width: ANCHO_UTIL });
      y = doc.y + 12;
    }

    for (const linea of data.lineas) {
      // Viñeta + "N cabezas" en negrita + " – Cliente" normal, como el mensaje original.
      doc.circle(MARGEN + 4, y + 6.5, 2.6).fill(PDF_COLORS.text);
      const xTexto = MARGEN + 16;
      const anchoTexto = ANCHO_UTIL - 16;

      doc
        .fillColor(PDF_COLORS.text)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(textoCabezas(linea.cabezas), xTexto, y, { width: anchoTexto, continued: true })
        .font("Helvetica")
        .text(` – ${linea.cliente}`, { width: anchoTexto });
      y = doc.y;

      if (linea.comentarios) {
        doc
          .fillColor(PDF_COLORS.textMuted)
          .font("Helvetica-Oblique")
          .fontSize(12)
          .text(`(${linea.comentarios})`, xTexto, y + 1, { width: anchoTexto });
        y = doc.y;
      }
      y += 8;
    }

    // Total
    y += 2;
    doc
      .moveTo(MARGEN, y)
      .lineTo(ANCHO - MARGEN, y)
      .lineWidth(1)
      .strokeColor(PDF_COLORS.border)
      .stroke();
    y += 10;
    doc
      .fillColor(brandColor)
      .font("Helvetica-Bold")
      .fontSize(15)
      .text(`TOTAL: ${textoCabezas(data.totalCabezas)}`, MARGEN, y, { width: ANCHO_UTIL });
    y = doc.y + 2;
    doc
      .fillColor(PDF_COLORS.textMuted)
      .font("Helvetica")
      .fontSize(11)
      .text(`${data.lineas.length} ${data.lineas.length === 1 ? "cliente" : "clientes"}`, MARGEN, y, {
        width: ANCHO_UTIL,
      });
    y = doc.y + 16;

    // NO LLEVAN
    if (data.noLlevan.length > 0) {
      const inicioCaja = y;
      doc
        .fillColor(PDF_COLORS.rechazo)
        .font("Helvetica-Bold")
        .fontSize(14)
        .text("NO LLEVAN", MARGEN + 10, inicioCaja + 10, { width: ANCHO_UTIL - 20 });
      let yCaja = doc.y + 6;
      for (const nombre of data.noLlevan) {
        doc.circle(MARGEN + 16, yCaja + 6.5, 2.6).fill(PDF_COLORS.text);
        doc
          .fillColor(PDF_COLORS.text)
          .font("Helvetica-Bold")
          .fontSize(14)
          .text(nombre, MARGEN + 28, yCaja, { width: ANCHO_UTIL - 38 });
        yCaja = doc.y + 6;
      }
      const altoCaja = yCaja + 4 - inicioCaja;
      // Recuadro con borde y franja de acento (PDFKit no puede pintar un
      // fondo "detrás" de texto ya escrito, por eso no lleva relleno).
      doc
        .roundedRect(MARGEN, inicioCaja, ANCHO_UTIL, altoCaja, 6)
        .lineWidth(1)
        .strokeColor(PDF_COLORS.rechazoBorder)
        .stroke();
      doc.rect(MARGEN, inicioCaja + 6, 3, altoCaja - 12).fill(PDF_COLORS.rechazo);
      y = inicioCaja + altoCaja + 12;
    }

    return y;
  }
}
