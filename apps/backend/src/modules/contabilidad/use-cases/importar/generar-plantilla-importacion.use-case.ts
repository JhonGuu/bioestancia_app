import ExcelJS from "exceljs";
import { injectable } from "inversify";

export type TipoPlantillaImportacion = "plan-cuentas" | "asientos" | "saldos-iniciales";

interface DefinicionPlantilla {
  nombreHoja: string;
  columnas: { encabezado: string; ancho: number }[];
  filasEjemplo: (string | number)[][];
  notas: string[];
}

const PLANTILLAS: Record<TipoPlantillaImportacion, DefinicionPlantilla> = {
  "plan-cuentas": {
    nombreHoja: "Plan de cuentas",
    columnas: [
      { encabezado: "Codigo", ancho: 16 },
      { encabezado: "Nombre", ancho: 32 },
      { encabezado: "Tipo", ancho: 20 },
      { encabezado: "CodigoPadre", ancho: 16 },
      { encabezado: "Imputable", ancho: 12 },
      { encabezado: "Monetaria", ancho: 12 },
      { encabezado: "Auxiliar", ancho: 16 },
    ],
    filasEjemplo: [
      ["1.1.01", "Caja y bancos", "Activo", "1.1", "No", "", ""],
      ["1.1.01.001", "Caja", "Activo", "1.1.01", "Si", "Si", ""],
      ["1.1.02.001", "Deudores por ventas", "Activo", "1.1.02", "Si", "Si", "Cliente"],
    ],
    notas: [
      "Tipo: Activo, Pasivo, Patrimonio Neto, Resultado Positivo, Resultado Negativo u Orden.",
      "CodigoPadre: dejalo vacío para una cuenta de primer nivel.",
      "Imputable: Si/No — si lo dejás vacío se toma como Si.",
      "Auxiliar: Cliente, Proveedor, Empleado, Frigorifico, Cuenta de fondos, Cheque, o vacío (ninguno).",
      "Podés incluir cuentas padre e hijas en el mismo archivo, en cualquier orden.",
    ],
  },
  asientos: {
    nombreHoja: "Asientos",
    columnas: [
      { encabezado: "Asiento", ancho: 12 },
      { encabezado: "Fecha", ancho: 14 },
      { encabezado: "Descripcion", ancho: 32 },
      { encabezado: "Tipo", ancho: 14 },
      { encabezado: "Respaldo", ancho: 16 },
      { encabezado: "Cuenta", ancho: 16 },
      { encabezado: "Debe", ancho: 14 },
      { encabezado: "Haber", ancho: 14 },
      { encabezado: "Detalle", ancho: 24 },
      { encabezado: "CentroCosto", ancho: 14 },
      { encabezado: "Auxiliar", ancho: 20 },
    ],
    filasEjemplo: [
      [1, "01/03/2026", "Compra de combustible", "Manual", "Con comprobante", "5.1.03.001", 45000, "", "Nafta camión", "", ""],
      [1, "01/03/2026", "", "", "", "1.1.01.001", "", 45000, "", "", ""],
      [2, "02/03/2026", "Cobro a cliente", "Manual", "", "1.1.01.001", 12000, "", "", "", ""],
      [2, "02/03/2026", "", "", "", "1.1.02.001", "", 12000, "", "", "Juan Pérez"],
    ],
    notas: [
      "Asiento: repetí el mismo valor en todas las líneas que forman un mismo asiento.",
      "Fecha, Descripcion, Tipo y Respaldo solo hace falta completarlos en la primera línea de cada asiento.",
      "Cada línea imputa al Debe o al Haber, nunca a los dos.",
      "Auxiliar: obligatorio solo si la cuenta es de control — nombre del cliente/proveedor/frigorífico tal cual está cargado, o el ID para empleado/cuenta de fondos/cheque.",
      "Tipo: Manual (default), Apertura, Cierre, Refundicion, Ajuste inflacion o Reclasificacion. Respaldo: Con comprobante, Sin comprobante (default) o Interno.",
    ],
  },
  "saldos-iniciales": {
    nombreHoja: "Saldos iniciales",
    columnas: [
      { encabezado: "Cuenta", ancho: 16 },
      { encabezado: "Importe", ancho: 16 },
      { encabezado: "Auxiliar", ancho: 20 },
      { encabezado: "Detalle", ancho: 24 },
    ],
    filasEjemplo: [
      ["1.1.01.001", 150000, "", "Saldo al inicio"],
      ["1.1.02.001", 85000, "Juan Pérez", ""],
      ["2.1.01.001", -60000, "Frigorífico San José", ""],
    ],
    notas: [
      "Importe con signo: positivo = lado natural de la cuenta, negativo = el contrario (ej. amortización acumulada).",
      "Auxiliar: obligatorio solo si la cuenta es de control (nombre del cliente/proveedor/frigorífico tal cual está cargado).",
      "El total tiene que cerrar (suma de debe = suma de haber) — si no cierra, se puede elegir una cuenta de ajuste al confirmar.",
    ],
  },
};

/** Genera la plantilla Excel descargable para uno de los tres importadores del módulo contable — solo encabezados, filas de ejemplo y notas de uso. */
@injectable()
export class GenerarPlantillaImportacion {
  async execute(tipo: TipoPlantillaImportacion): Promise<{ buffer: Buffer; filename: string }> {
    const definicion = PLANTILLAS[tipo];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Bioestancia";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(definicion.nombreHoja);
    definicion.columnas.forEach((columna, indice) => {
      sheet.getColumn(indice + 1).width = columna.ancho;
    });

    const headerRow = sheet.addRow(definicion.columnas.map((c) => c.encabezado));
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E5E5" } };
      cell.border = { bottom: { style: "thin" } };
    });

    for (const fila of definicion.filasEjemplo) sheet.addRow(fila);

    if (definicion.notas.length > 0) {
      sheet.addRow([]);
      const notaHeader = sheet.addRow(["Notas:"]);
      notaHeader.font = { italic: true, bold: true };
      for (const nota of definicion.notas) {
        const row = sheet.addRow([`• ${nota}`]);
        row.font = { italic: true, size: 9, color: { argb: "FF666666" } };
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer), filename: `plantilla-${tipo}.xlsx` };
  }
}
