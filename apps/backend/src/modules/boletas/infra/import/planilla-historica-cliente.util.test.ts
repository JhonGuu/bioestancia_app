import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { HOJAS_NO_CLIENTE, PlanillaHistorica, mapearFormaVenta } from "@/modules/boletas/infra/import/planilla-historica-cliente.util";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";

/**
 * Reproduce la forma REAL de una hoja de cliente de `VENTAS 2026.xlsm`
 * (verificada con `openpyxl` sobre el archivo real que compartió Juan
 * Jose): unas filas de cabecera con datos sueltos (nombre, saldo, contacto)
 * ANTES de la tabla, y recién ahí el encabezado real
 * `SEM | Fecha | Forma de venta | Cantidad | Kg | Concepto | Importe | Tipo
 * | Observaciones | Saldo | ...`.
 */
function construirWorkbook(hojas: Record<string, (string | number | Date | null)[][]>): Buffer {
  const wb = XLSX.utils.book_new();
  for (const [nombre, filas] of Object.entries(hojas)) {
    const ws = XLSX.utils.aoa_to_sheet(filas);
    XLSX.utils.book_append_sheet(wb, ws, nombre);
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const CABECERA_RUIDO: (string | number | Date | null)[][] = [
  [null, null, null, null, null, null, "CUENTA", "CORRIENTE"],
  [],
  [null, "FECHA ENVÍO", null, new Date(Date.UTC(2026, 8, 8))],
  [null, null, "Cliente", null, null, null, null, "E-mail:"],
  [null, null, "Test Cliente"],
  [],
  [null, null, "SALDO VENCIDO", null, null, null, "SALDO ACTUAL"],
  [null, null, 1000, null, null, null, 5000],
  [null, null, "solo boletas vencidas", null, null, null, "al día de hoy"],
  [],
  [],
];

const ENCABEZADO_REAL = [
  null,
  "SEM",
  "Fecha",
  "Forma de venta",
  "Cantidad",
  "Kg",
  "Concepto",
  "Importe",
  "Tipo",
  "Observaciones",
  "Saldo",
  "Fecha Vto Venta",
  "Fecha Vto",
  "Vencido",
];

function filaCliente(fila: (string | number | Date | null)[]): (string | number | Date | null)[] {
  return [null, ...fila];
}

describe("listarHojasClientes", () => {
  it("excluye las hojas auxiliares del libro (DEUDAS, CHEQUES, etc.) y las marcadas para no usar", () => {
    const buffer = construirWorkbook({
      "Test Cliente": [...CABECERA_RUIDO, ENCABEZADO_REAL],
      DEUDAS: [["Nombre", "Saldo"]],
      CHEQUES: [["Cheque de"]],
      "Echenique NO USAR": [ENCABEZADO_REAL],
      "Vargas Jooaquin": [ENCABEZADO_REAL],
    });

    const hojas = PlanillaHistorica.desdeBuffer(buffer).listarHojasClientes();

    expect(hojas).toEqual(["Test Cliente"]);
  });

  it("HOJAS_NO_CLIENTE incluye las dos hojas marcadas explícitamente para excluir", () => {
    expect(HOJAS_NO_CLIENTE.has("Echenique NO USAR")).toBe(true);
    expect(HOJAS_NO_CLIENTE.has("Vargas Jooaquin")).toBe(true);
    // La hoja válida NO está en la lista de exclusión.
    expect(HOJAS_NO_CLIENTE.has("Vargas Joaquin")).toBe(false);
  });
});

describe("leerFilasPlanillaCliente", () => {
  it("encuentra el encabezado real más abajo de la cabecera de datos sueltos, e ignora las filas de cabecera", () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ...CABECERA_RUIDO,
        ENCABEZADO_REAL,
        filaCliente([52, new Date(Date.UTC(2025, 11, 28)), null, null, null, "Saldo inicial", 2970150.32, "Pago", "Comenzo el 2026"]),
        filaCliente([53, new Date(Date.UTC(2026, 0, 5)), "Cabeza capón", 1, 100, "Ventas: Cabeza capón: 1 / 100 kg", 325000, "Venta"]),
      ],
    });

    const filas = PlanillaHistorica.desdeBuffer(buffer).leerFilasCliente("Test Cliente");

    expect(filas).toHaveLength(2);
    expect(filas[0]?.concepto).toBe("Saldo inicial");
    expect(filas[1]?.formaVenta).toBe("Cabeza capón");
    expect(filas[1]?.tipo).toBe("Venta");
  });

  it("no cuenta las filas totalmente vacías (sin fecha, concepto ni tipo) como datos", () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ...CABECERA_RUIDO,
        ENCABEZADO_REAL,
        filaCliente([52, new Date(Date.UTC(2025, 11, 28)), null, null, null, "Saldo inicial", 1000, "Pago"]),
        [], // fila vacía en medio del libro mayor
        filaCliente([53, new Date(Date.UTC(2026, 0, 5)), "Pulpa", 1, 50, "Ventas: Pulpa", 500, "Venta"]),
      ],
    });

    const filas = PlanillaHistorica.desdeBuffer(buffer).leerFilasCliente("Test Cliente");

    expect(filas).toHaveLength(2);
  });

  it("tira un error legible si la hoja no tiene el formato esperado (sin encabezado reconocible)", () => {
    const buffer = construirWorkbook({ "Hoja Rara": [["Columna A", "Columna B"], [1, 2]] });

    expect(() => PlanillaHistorica.desdeBuffer(buffer).leerFilasCliente("Hoja Rara")).toThrow(/formato esperado/);
  });

  it("tira un error legible si la hoja no existe", () => {
    const buffer = construirWorkbook({ "Test Cliente": [...CABECERA_RUIDO, ENCABEZADO_REAL] });

    expect(() => PlanillaHistorica.desdeBuffer(buffer).leerFilasCliente("No Existe")).toThrow(/No existe la hoja/);
  });
});

describe("mapearFormaVenta", () => {
  it("mapea los 5 valores reales verificados en las hojas de cliente", () => {
    expect(mapearFormaVenta("Cabeza capón")).toEqual({ formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CAPON });
    expect(mapearFormaVenta("Cabeza chancha")).toEqual({ formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CERDA_CHANCHA });
    expect(mapearFormaVenta("1/2 res capón")).toEqual({ formaVenta: FormaVenta.MEDIA_RES, categoria: CategoriaPorcino.CAPON });
    expect(mapearFormaVenta("Pulpa")).toEqual({ formaVenta: FormaVenta.PULPA, categoria: null });
    expect(mapearFormaVenta("Compensación kg")).toEqual({ formaVenta: FormaVenta.COMPENSACION_KG, categoria: null });
  });

  it("es tolerante a mayúsculas/tildes/espacios", () => {
    expect(mapearFormaVenta("  cabeza CAPON  ")).toEqual({ formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CAPON });
  });

  it('reconoce la variante real "compensación de kgs" (minúscula) como el mismo concepto que "Compensación kg"', () => {
    expect(mapearFormaVenta("compensación de kgs")).toEqual({ formaVenta: FormaVenta.COMPENSACION_KG, categoria: null });
  });

  it("devuelve null para un valor fuera del catálogo cerrado — no adivina", () => {
    expect(mapearFormaVenta("Media res chancha")).toBeNull();
    expect(mapearFormaVenta("")).toBeNull();
  });
});
