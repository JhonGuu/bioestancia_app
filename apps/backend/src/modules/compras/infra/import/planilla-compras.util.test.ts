import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";

import { PlanillaCompras, parsearComposicionAnimal } from "@/modules/compras/infra/import/planilla-compras.util";

/**
 * Reproduce la forma REAL de "ABASTO CERDO" en `COMPRAS PARA JUAN.xlsx`
 * (verificada con `openpyxl` sobre el archivo real): la fila 1 trae celdas
 * sueltas de referencia (`#REF!`, algún número de fórmula rota) — NO es el
 * encabezado — y recién la fila 2 trae los nombres de columna reales.
 */
const FILA_RUIDO = [null, null, null, null, null, null, null, null, null, null, "#REF!"];

const ENCABEZADO = [
  "Semana",
  "Fecha de carga",
  "Fecha faena",
  "Lugar de carga",
  "Nº remito criadero",
  "Nº tropa",
  "LIQ DE COMPRA",
  "lugar de faena",
  "DTE",
  "Animal",
  "$ kg de animal en pie SIN IVA",
  "$ kg de animal en pie CON IVA",
  "Cant. de anim. Cargados",
  "Cant. de anim. Faenados",
  "Kg BRUTO Jaula",
  "Kg NETO jaula",
  "Kg NETO promedio por animal",
  "Precio Jaula",
  "Rinde faena",
  "RINDE",
  "Kg RENDIDOS",
  "Precio promeido VENTA por kg",
  "Precio TOTAL VENTA CARNE",
  "Flete animal en pie",
  "Cámara + Flete (animal faenado)",
  "LAVADO",
  "Gastos Viaje",
  "Faena",
  "Reparto",
  "Gas Oil",
  "Extras",
  "IMUESTO A DEPOSITO",
  "TOTAL GASTOS",
  "GANANCIA",
  "COSTO NETO por kg de carne",
  "RENTABILIDAD ( ganancia neta)",
  "RENTABILIDAD \ncosto neto/ precio promedio venta",
  "RENTABILIDAD\ncosto neto/ costo en pie",
  "GANANCIA NETA estimada",
  "RENTABILIDAD BRUTA PROMEDIO",
  "Rentabilidad bruta",
  "kg liquidados",
  "$ TOTAL CON IVA FACTURADO",
  "RENTABILIDAD BRUTA FACTURADA",
];

/** Índices (0-based) de las columnas que le importan a `PlanillaCompras`, dentro de `ENCABEZADO` — para armar filas de datos legibles en los tests sin tener que llenar las ~44 columnas siempre. */
const COL = {
  fechaCarga: 1,
  fechaFaena: 2,
  lugarCarga: 3,
  remitoCriadero: 4,
  numeroTropa: 5,
  liqDeCompra: 6,
  lugarFaena: 7,
  dte: 8,
  animal: 9,
  precioSinIva: 10,
  precioConIva: 11,
  cantCargados: 12,
  kgBruto: 14,
  kgNeto: 15,
  kgRendidos: 20,
  faena: 27,
  ganancia: 33,
  rentabilidadFacturada: 43,
};

function filaVacia(): (string | number | Date | null)[] {
  return new Array(ENCABEZADO.length).fill(null);
}

function construirWorkbook(filas: (string | number | Date | null)[][]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([FILA_RUIDO, ENCABEZADO, ...filas]);
  XLSX.utils.book_append_sheet(wb, ws, "ABASTO CERDO");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("PlanillaCompras.desdeBuffer", () => {
  it("encuentra el encabezado en la fila 2 (no en la 1) y lee las filas de datos", () => {
    const fila1 = filaVacia();
    fila1[COL.fechaCarga] = new Date(Date.UTC(2025, 0, 15));
    fila1[COL.fechaFaena] = new Date(Date.UTC(2025, 0, 17));
    fila1[COL.lugarCarga] = "CERDO DE LOS LLANOS";
    fila1[COL.remitoCriadero] = "026-0293";
    fila1[COL.numeroTropa] = "5024-CLA";
    fila1[COL.lugarFaena] = "Cerdo de Los Andes S.A.";
    fila1[COL.dte] = "028542056-3";
    fila1[COL.animal] = "150 CAPON";
    fila1[COL.precioSinIva] = 1723;
    fila1[COL.precioConIva] = 1903.915;
    fila1[COL.cantCargados] = 150;
    fila1[COL.kgBruto] = 28460;
    fila1[COL.kgNeto] = 27246;
    fila1[COL.kgRendidos] = 20808.7;
    fila1[COL.faena] = 2724000;
    fila1[COL.ganancia] = 3600635.83;
    fila1[COL.rentabilidadFacturada] = 0.1412;

    const buffer = construirWorkbook([fila1]);
    const planilla = PlanillaCompras.desdeBuffer(buffer);
    const filas = planilla.listarFilas();

    expect(filas).toHaveLength(1);
    expect(filas[0]!.numeroTropa).toBe("5024-CLA");
    expect(filas[0]!.lugarCarga).toBe("CERDO DE LOS LLANOS");
    expect(filas[0]!.animal).toBe("150 CAPON");
    expect(filas[0]!.kgRendidos).toBe(20808.7);
  });

  it("salta filas completamente vacías", () => {
    const fila1 = filaVacia();
    fila1[COL.numeroTropa] = "5024-CLA";
    fila1[COL.fechaCarga] = new Date(Date.UTC(2025, 0, 15));

    const buffer = construirWorkbook([fila1, filaVacia(), filaVacia()]);
    const planilla = PlanillaCompras.desdeBuffer(buffer);
    expect(planilla.listarFilas()).toHaveLength(1);
  });

  it("tira error si no encuentra la fila de encabezado", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["no", "es", "un", "encabezado", "valido"]]);
    XLSX.utils.book_append_sheet(wb, ws, "ABASTO CERDO");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    expect(() => PlanillaCompras.desdeBuffer(buffer)).toThrow(/encabezado/i);
  });
});

describe("parsearComposicionAnimal", () => {
  it("parsea una sola categoría sin número (fila de una sola categoría)", () => {
    expect(parsearComposicionAnimal("CAPON")).toEqual([{ categoria: "CAPON", cabezas: null }]);
  });

  it("parsea una sola categoría con número adelante", () => {
    expect(parsearComposicionAnimal("150 CAPON")).toEqual([{ categoria: "CAPON", cabezas: 150 }]);
  });

  it("parsea número atrás de la palabra (variante real de la planilla)", () => {
    expect(parsearComposicionAnimal("CAPON 140 + MEI 90")).toEqual([
      { categoria: "CAPON", cabezas: 140 },
      { categoria: "MEI", cabezas: 90 },
    ]);
  });

  it("parsea composición mixta separada por '+'", () => {
    expect(parsearComposicionAnimal("80 CAP + 80 MEI")).toEqual([
      { categoria: "CAPON", cabezas: 80 },
      { categoria: "MEI", cabezas: 80 },
    ]);
  });

  it("parsea composición mixta separada por 'y'/'Y' (variante real)", () => {
    expect(parsearComposicionAnimal("99 CAP y 61 MEI")).toEqual([
      { categoria: "CAPON", cabezas: 99 },
      { categoria: "MEI", cabezas: 61 },
    ]);
  });

  it("reconoce el typo real 'CAPOM'", () => {
    expect(parsearComposicionAnimal("38 MEI + 92 CAPOM")).toEqual([
      { categoria: "MEI", cabezas: 38 },
      { categoria: "CAPON", cabezas: 92 },
    ]);
  });

  it("mapea CERDAS/CHANCHA/CHA a la misma categoría", () => {
    expect(parsearComposicionAnimal("20 CHA")).toEqual([{ categoria: "CHANCHA", cabezas: 20 }]);
    expect(parsearComposicionAnimal("20 CERDAS")).toEqual([{ categoria: "CHANCHA", cabezas: 20 }]);
    expect(parsearComposicionAnimal("1 CHANCHA")).toEqual([{ categoria: "CHANCHA", cabezas: 1 }]);
  });

  it("devuelve null si alguna porción no matchea ninguna palabra conocida", () => {
    expect(parsearComposicionAnimal("150 VACAS")).toBeNull();
    expect(parsearComposicionAnimal("")).toBeNull();
  });
});
