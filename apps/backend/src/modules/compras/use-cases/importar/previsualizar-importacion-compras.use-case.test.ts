import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

import { PrevisualizarImportacionCompras } from "@/modules/compras/use-cases/importar/previsualizar-importacion-compras.use-case";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";

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
  "x1",
  "x2",
  "GANANCIA NETA estimada",
  "RENTABILIDAD BRUTA PROMEDIO",
  "Rentabilidad bruta",
  "kg liquidados",
  "$ TOTAL CON IVA FACTURADO",
  "RENTABILIDAD BRUTA FACTURADA",
];

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

/** Fila "feliz" completa — los tests parten de acá y pisan solo lo que quieren romper. */
function filaCompleta(overrides: Partial<Record<keyof typeof COL, string | number | Date | null>> = {}) {
  const fila = filaVacia();
  fila[COL.fechaCarga] = new Date(Date.UTC(2025, 0, 15));
  fila[COL.fechaFaena] = new Date(Date.UTC(2025, 0, 17));
  fila[COL.lugarCarga] = "CERDO DE LOS LLANOS";
  fila[COL.remitoCriadero] = "026-0293";
  fila[COL.numeroTropa] = "5024-CLA";
  fila[COL.liqDeCompra] = null;
  fila[COL.lugarFaena] = "Cerdo de Los Andes S.A.";
  fila[COL.dte] = "028542056-3";
  fila[COL.animal] = "150 CAPON";
  fila[COL.precioSinIva] = 1723;
  fila[COL.precioConIva] = 1903.915;
  fila[COL.cantCargados] = 150;
  fila[COL.kgBruto] = 28460;
  fila[COL.kgNeto] = 27246;
  fila[COL.kgRendidos] = 20808.7;
  fila[COL.faena] = 2724000;
  fila[COL.ganancia] = 3600635.83;
  fila[COL.rentabilidadFacturada] = 0.1412;
  for (const [campo, valor] of Object.entries(overrides)) {
    fila[COL[campo as keyof typeof COL]] = valor as string | number | Date | null;
  }
  return fila;
}

function construirWorkbook(filas: (string | number | Date | null)[][]): Buffer {
  const wb = XLSX.utils.book_new();
  const filaRuido = new Array(ENCABEZADO.length).fill(null);
  const ws = XLSX.utils.aoa_to_sheet([filaRuido, ENCABEZADO, ...filas]);
  XLSX.utils.book_append_sheet(wb, ws, "ABASTO CERDO");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function proveedor(overrides: Partial<Proveedor>): Proveedor {
  return {
    id: "proveedor-existente-1",
    empresaId: "empresa-1",
    nombre: null,
    apellido: null,
    razonSocial: null,
    cuit: null,
    dni: null,
    domicilio: null,
    email: null,
    pais: null,
    provincia: null,
    ubicacion: null,
    condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    datosBancarios: null,
    porcentajeDesbaste: null,
    renspa: null,
    codigoAfip: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function frigorifico(overrides: Partial<Frigorifico>): Frigorifico {
  return {
    id: "frigorifico-existente-1",
    empresaId: "empresa-1",
    nombre: "Cerdo de Los Andes S.A.",
    cuit: null,
    senasaNumero: null,
    rucaNumero: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function crearUseCase(proveedores: Proveedor[] = [], frigorificos: Frigorifico[] = []) {
  const proveedorRepository: ProveedorRepository = {
    getById: vi.fn(),
    list: vi.fn().mockResolvedValue(proveedores),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reactivar: vi.fn(),
  };
  const frigorificoRepository: FrigorificoRepository = {
    getById: vi.fn(),
    list: vi.fn().mockResolvedValue(frigorificos),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    reactivar: vi.fn(),
  };
  return new PrevisualizarImportacionCompras(proveedorRepository, frigorificoRepository);
}

describe("PrevisualizarImportacionCompras", () => {
  it("arma una compra completa (compra + categorías + faena + liquidaciones) desde una fila feliz", async () => {
    const useCase = crearUseCase(
      [proveedor({ id: "prov-1", razonSocial: "CERDO DE LOS LLANOS" })],
      [frigorifico({ id: "frig-1", nombre: "Cerdo de Los Andes S.A." })],
    );
    const buffer = construirWorkbook([filaCompleta()]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.conError).toEqual([]);
    expect(preview.comprasACrear).toHaveLength(1);
    const compra = preview.comprasACrear[0]!;
    expect(compra.numero).toBe("5024-CLA");
    expect(compra.proveedorId).toBe("prov-1");
    expect(compra.frigorificoId).toBe("frig-1");
    expect(compra.fecha).toBe("2025-01-15");
    expect(compra.fechaFaena).toBe("2025-01-17");
    expect(compra.dte).toBe("028542056-3");
    expect(compra.remito).toBe("026-0293");
    expect(compra.categorias).toEqual([{ categoria: CategoriaPorcino.CAPON, cabezas: 150 }]);
    expect(compra.kgVivoTotalFaena).toBe(27246);
    expect(compra.kgCarneTotalFaena).toBe(20808.7);
    expect(compra.montoFaenaTotal).toBe(2724000);
    // 1903.915 / 1723 - 1 = 10.5% (alícuota reducida real de AFIP para carne).
    expect(compra.porcentajeIvaLiquidacion).toBeCloseTo(10.5, 1);
    // Sin "LIQ DE COMPRA" en la planilla -> placeholder.
    expect(compra.numeroComprobanteLiquidacion).toBe("S/D (tropa 5024-CLA)");
    expect(compra.rentabilidadReferenciaExcel).toContain("ganancia $3600635.83");
    expect(compra.rentabilidadReferenciaExcel).toContain("14.12%");
  });

  it("detecta proveedor y frigorífico nuevos cuando no matchean ningún existente", async () => {
    const useCase = crearUseCase([], []);
    const buffer = construirWorkbook([filaCompleta()]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear[0]!.proveedorId).toBeNull();
    expect(preview.comprasACrear[0]!.frigorificoId).toBeNull();
    expect(preview.proveedoresNuevos).toEqual(["CERDO DE LOS LLANOS"]);
    expect(preview.frigorificosNuevos).toEqual(["Cerdo de Los Andes S.A."]);
  });

  it("usa el número de comprobante real cuando la planilla sí lo trae", async () => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ liqDeCompra: "LIQ. 1359" })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear[0]!.numeroComprobanteLiquidacion).toBe("LIQ. 1359");
  });

  it("no bloquea la fila si falta el frigorífico — queda sin asignar", async () => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ lugarFaena: null })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.conError).toEqual([]);
    expect(preview.comprasACrear[0]!.frigorificoNombre).toBeNull();
    expect(preview.comprasACrear[0]!.frigorificoId).toBeNull();
  });

  it.each([
    ["numeroTropa", null, "sin número de tropa"],
    ["lugarCarga", null, "sin proveedor"],
    ["precioSinIva", null, "sin precio"],
    ["kgBruto", null, "sin kg bruto"],
    ["kgNeto", null, "sin kg neto"],
    ["kgRendidos", null, "sin kg rendidos"],
    ["faena", null, "sin gasto de faena"],
  ] as const)("marca error de fila cuando falta %s", async (campo, valor, mensajeEsperado) => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ [campo]: valor })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear).toEqual([]);
    expect(preview.conError).toHaveLength(1);
    expect(preview.conError[0]!.errores.join(" ")).toContain(mensajeEsperado);
  });

  it("marca error cuando la composición de animales no matchea ninguna palabra conocida", async () => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ animal: "150 VACAS" })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear).toEqual([]);
    expect(preview.conError[0]!.errores.join(" ")).toContain("no reconocida");
  });

  it("resuelve una sola categoría sin número usando Cant. de anim. Cargados", async () => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ animal: "CAPON", cantCargados: 150 })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear[0]!.categorias).toEqual([{ categoria: CategoriaPorcino.CAPON, cabezas: 150 }]);
  });

  it("parsea composición mixta separada por '+' en varias líneas de categoría", async () => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ animal: "80 CAP + 80 MEI", cantCargados: 160 })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear[0]!.categorias).toEqual([
      { categoria: CategoriaPorcino.CAPON, cabezas: 80 },
      { categoria: CategoriaPorcino.MACHOS_ENTEROS_INMUNOCASTRADOS, cabezas: 80 },
    ]);
  });

  it("marca error cuando las cabezas de Animal no coinciden con Cant. de anim. Cargados más allá de la tolerancia", async () => {
    const useCase = crearUseCase();
    // Caso real de la planilla: "200 CAPON + 200 MEI" con Cargados=200 (probable duplicación por typo).
    const buffer = construirWorkbook([filaCompleta({ animal: "200 CAPON + 200 MEI", cantCargados: 200 })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear).toEqual([]);
    expect(preview.conError[0]!.errores.join(" ")).toContain("no coinciden");
  });

  it("tolera una diferencia chica entre Animal y Cargados (típica de carga a mano)", async () => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ animal: "80 CAPON + 79 MEI", cantCargados: 160 })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.conError).toEqual([]);
    expect(preview.comprasACrear).toHaveLength(1);
  });

  it("no genera texto de referencia de rentabilidad si la planilla no trae ni ganancia ni rentabilidad", async () => {
    const useCase = crearUseCase();
    const buffer = construirWorkbook([filaCompleta({ ganancia: null, rentabilidadFacturada: null })]);

    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.comprasACrear[0]!.rentabilidadReferenciaExcel).toBeNull();
  });
});
