import { describe, expect, it, vi } from "vitest";

import { ConfirmarImportacionCompras } from "@/modules/compras/use-cases/importar/confirmar-importacion-compras.use-case";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";
import { Frigorifico } from "@/modules/frigorificos/domain/frigorifico";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { Compra } from "@/modules/compras/domain/compra";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { ResultadoFaenaRepository } from "@/modules/resultado-faena/domain/resultado-faena.repository";
import { ResultadoFaena } from "@/modules/resultado-faena/domain/resultado-faena";
import { LiquidacionCompraRepository } from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { LiquidacionCompra } from "@/modules/liquidacion-compra/domain/liquidacion-compra";
import { LiquidacionFaenaRepository } from "@/modules/liquidacion-faena/domain/liquidacion-faena.repository";
import { LiquidacionFaena } from "@/modules/liquidacion-faena/domain/liquidacion-faena";
import { Logger } from "@/shared/infra/logger/logger";
import { CompraAImportar } from "@/modules/compras/domain/importacion-compras";

const EMPRESA_ID = "empresa-1";

function compraAImportarBase(overrides: Partial<CompraAImportar> = {}): CompraAImportar {
  return {
    fila: 3,
    numero: "5024-CLA",
    proveedorNombre: "CERDO DE LOS LLANOS",
    proveedorId: "prov-1",
    frigorificoNombre: "Cerdo de Los Andes S.A.",
    frigorificoId: "frig-1",
    fecha: "2025-01-15",
    fechaFaena: "2025-01-17",
    dte: "028542056-3",
    remito: "026-0293",
    precioCompraKg: 1723,
    pesoBruto: 28460,
    pesoNeto: 27246,
    porcentajeDesbaste: 4.27,
    categorias: [{ categoria: CategoriaPorcino.CAPON, cabezas: 150 }],
    kgVivoTotalFaena: 27246,
    kgCarneTotalFaena: 20808.7,
    numeroComprobanteLiquidacion: "S/D (tropa 5024-CLA)",
    porcentajeIvaLiquidacion: 10.5,
    montoFaenaTotal: 2724000,
    rentabilidadReferenciaExcel: null,
    ...overrides,
  };
}

function proveedor(overrides: Partial<Proveedor> & Pick<Proveedor, "id">): Proveedor {
  return {
    empresaId: EMPRESA_ID,
    nombre: null,
    apellido: null,
    razonSocial: "Proveedor nuevo",
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

function frigorifico(overrides: Partial<Frigorifico> & Pick<Frigorifico, "id">): Frigorifico {
  return {
    empresaId: EMPRESA_ID,
    nombre: "Frigorífico nuevo",
    cuit: null,
    senasaNumero: null,
    rucaNumero: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function compra(overrides: Partial<Compra> & Pick<Compra, "id">): Compra {
  return {
    empresaId: EMPRESA_ID,
    proveedorId: "prov-1",
    numero: "5024-CLA",
    especie: EspecieAnimal.PORCINO,
    letra: null,
    fecha: new Date("2025-01-15"),
    dte: "028542056-3",
    remito: "026-0293",
    porcentajeDesbaste: 4.27,
    precioCompraKg: 1723,
    pesoBruto: 28460,
    pesoNeto: 27246,
    cerrada: false,
    fechaCierre: null,
    pesoFinalVenta: null,
    rinde: null,
    grupoTropasId: null,
    alertaSuperavit: false,
    comentarios: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function compraCategoria(overrides: Partial<CompraCategoria> & Pick<CompraCategoria, "id" | "compraId" | "categoria" | "cabezas">): CompraCategoria {
  return {
    raza: null,
    pesoBruto: null,
    pesoNeto: null,
    kgVivoFaena: null,
    kgCarne: null,
    porcentajeMagro: null,
    destinoComercial: null,
    cuartosDelantero: null,
    cuartosTrasero: null,
    comisosCabezas: null,
    comisosKg: null,
    precioKg: null,
    importeBruto: null,
    porcentajeIva: null,
    importeIva: null,
    canonFaenaPorAnimal: null,
    canonFaenaSubtotal: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function resultadoFaena(overrides: Partial<ResultadoFaena> & Pick<ResultadoFaena, "id" | "compraId">): ResultadoFaena {
  return {
    frigorificoId: null,
    fechaFaena: new Date("2025-01-17"),
    numero: null,
    numeroAutorizacion: null,
    kgVivoTotal: 0,
    kgCarneTotal: 0,
    comisosKg: 0,
    comisosCabezas: 0,
    rendimiento: 0,
    comentarios: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function liquidacionCompra(overrides: Partial<LiquidacionCompra> & Pick<LiquidacionCompra, "id" | "compraId">): LiquidacionCompra {
  return {
    numeroComprobante: "S/D",
    fecha: new Date("2025-01-17"),
    fechaOperacion: null,
    cae: null,
    fechaVencimientoCae: null,
    importeBruto: 0,
    ivaSobreBruto: 0,
    totalGastos: null,
    ivaSobreGastos: null,
    totalTributos: null,
    importeNeto: 0,
    comentarios: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function liquidacionFaena(overrides: Partial<LiquidacionFaena> & Pick<LiquidacionFaena, "id" | "compraId">): LiquidacionFaena {
  return {
    frigorificoId: null,
    fecha: new Date("2025-01-17"),
    comentarios: null,
    total: 0,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function construirCaso() {
  let contadorCompra = 0;
  let contadorCategoria = 0;

  const proveedorRepository: ProveedorRepository = {
    getById: vi.fn(),
    list: vi.fn(),
    create: vi.fn().mockImplementation(async (input) => proveedor({ id: `prov-nuevo-${input.razonSocial}`, razonSocial: input.razonSocial })),
    update: vi.fn(),
    delete: vi.fn(),
    reactivar: vi.fn(),
  };
  const frigorificoRepository: FrigorificoRepository = {
    getById: vi.fn(),
    list: vi.fn(),
    create: vi.fn().mockImplementation(async (input) => frigorifico({ id: `frig-nuevo-${input.nombre}`, nombre: input.nombre })),
    update: vi.fn(),
    delete: vi.fn(),
    reactivar: vi.fn(),
  };
  const compraRepository: CompraRepository = {
    getById: vi.fn(),
    list: vi.fn() as unknown as CompraRepository["list"],
    create: vi.fn().mockImplementation(async (input) => compra({ id: `compra-${++contadorCompra}`, ...input })),
    update: vi.fn(),
    cerrar: vi.fn(),
    reabrir: vi.fn(),
    listByGrupo: vi.fn(),
    asignarGrupo: vi.fn(),
  };
  const compraCategoriaRepository: CompraCategoriaRepository = {
    listByCompra: vi.fn(),
    getById: vi.fn(),
    createMany: vi.fn().mockImplementation(async (input: { compraId: string; categoria: CategoriaPorcino; cabezas: number }[]) =>
      input.map((linea) => compraCategoria({ id: `cat-${++contadorCategoria}`, compraId: linea.compraId, categoria: linea.categoria, cabezas: linea.cabezas })),
    ),
    syncForCompra: vi.fn(),
    actualizarFaena: vi.fn().mockImplementation(async (id, input) => compraCategoria({ id, compraId: "compra-x", categoria: CategoriaPorcino.CAPON, cabezas: 1, ...input })),
    actualizarLiquidacion: vi.fn().mockImplementation(async (id, input) => compraCategoria({ id, compraId: "compra-x", categoria: CategoriaPorcino.CAPON, cabezas: 1, ...input })),
    actualizarCanonFaena: vi.fn().mockImplementation(async (id, input) => compraCategoria({ id, compraId: "compra-x", categoria: CategoriaPorcino.CAPON, cabezas: 1, ...input })),
  };
  const resultadoFaenaRepository: ResultadoFaenaRepository = {
    getById: vi.fn(),
    getByCompraId: vi.fn(),
    create: vi.fn().mockImplementation(async (input) => resultadoFaena({ id: "resultado-1", ...input })),
  };
  const liquidacionCompraRepository: LiquidacionCompraRepository = {
    getById: vi.fn(),
    getByCompraId: vi.fn(),
    list: vi.fn(),
    create: vi.fn().mockImplementation(async (input) => liquidacionCompra({ id: "liq-compra-1", ...input })),
    updateCae: vi.fn(),
  };
  const liquidacionFaenaRepository: LiquidacionFaenaRepository = {
    getById: vi.fn(),
    getByCompraId: vi.fn(),
    list: vi.fn(),
    create: vi.fn().mockImplementation(async (input) => liquidacionFaena({ id: "liq-faena-1", ...input })),
  };
  const logger: Logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as Logger;

  const useCase = new ConfirmarImportacionCompras(
    proveedorRepository,
    frigorificoRepository,
    compraRepository,
    compraCategoriaRepository,
    resultadoFaenaRepository,
    liquidacionCompraRepository,
    liquidacionFaenaRepository,
    logger,
  );

  return {
    useCase,
    proveedorRepository,
    frigorificoRepository,
    compraRepository,
    compraCategoriaRepository,
    resultadoFaenaRepository,
    liquidacionCompraRepository,
    liquidacionFaenaRepository,
  };
}

describe("ConfirmarImportacionCompras", () => {
  it("crea la cadena completa para una tropa con proveedor y frigorífico ya existentes", async () => {
    const caso = construirCaso();

    const resultado = await caso.useCase.execute({ empresaId: EMPRESA_ID, compras: [compraAImportarBase()] });

    expect(resultado).toEqual({
      creadas: 1,
      fallidas: 0,
      detalle: [{ fila: 3, numero: "5024-CLA", ok: true, compraId: expect.any(String) }],
    });
    expect(caso.proveedorRepository.create).not.toHaveBeenCalled();
    expect(caso.frigorificoRepository.create).not.toHaveBeenCalled();
    expect(caso.compraRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ empresaId: EMPRESA_ID, proveedorId: "prov-1", numero: "5024-CLA", especie: EspecieAnimal.PORCINO }),
    );
    expect(caso.compraCategoriaRepository.createMany).toHaveBeenCalledWith([
      { compraId: expect.any(String), categoria: CategoriaPorcino.CAPON, cabezas: 150 },
    ]);
    expect(caso.resultadoFaenaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ frigorificoId: "frig-1", kgVivoTotal: 27246, kgCarneTotal: 20808.7, rendimiento: expect.closeTo(76.38, 1) }),
    );
    expect(caso.liquidacionCompraRepository.create).toHaveBeenCalledWith(
      // 1723 $/kg sin IVA * 27246 kg vivo de faena (proxy: kg neto jaula) = importe bruto exacto.
      expect.objectContaining({ numeroComprobante: "S/D (tropa 5024-CLA)", importeBruto: 46944858 }),
    );
    expect(caso.liquidacionFaenaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ frigorificoId: "frig-1", total: 2724000 }),
    );
  });

  it("crea proveedor y frigorífico nuevos cuando no vienen resueltos, y los cachea entre filas", async () => {
    const caso = construirCaso();
    const compras = [
      compraAImportarBase({ fila: 1, numero: "A", proveedorId: null, frigorificoId: null }),
      compraAImportarBase({ fila: 2, numero: "B", proveedorId: null, frigorificoId: null }),
    ];

    const resultado = await caso.useCase.execute({ empresaId: EMPRESA_ID, compras });

    expect(resultado.creadas).toBe(2);
    expect(caso.proveedorRepository.create).toHaveBeenCalledTimes(1);
    expect(caso.proveedorRepository.create).toHaveBeenCalledWith({
      empresaId: EMPRESA_ID,
      razonSocial: "CERDO DE LOS LLANOS",
      condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    });
    expect(caso.frigorificoRepository.create).toHaveBeenCalledTimes(1);
    expect(caso.frigorificoRepository.create).toHaveBeenCalledWith({
      empresaId: EMPRESA_ID,
      nombre: "Cerdo de Los Andes S.A.",
    });
  });

  it("no crea frigorífico cuando la fila no trae ninguno", async () => {
    const caso = construirCaso();
    const compraSinFrigorifico = compraAImportarBase({ frigorificoNombre: null, frigorificoId: null });

    await caso.useCase.execute({ empresaId: EMPRESA_ID, compras: [compraSinFrigorifico] });

    expect(caso.frigorificoRepository.create).not.toHaveBeenCalled();
    expect(caso.resultadoFaenaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ frigorificoId: undefined }));
    expect(caso.liquidacionFaenaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ frigorificoId: undefined }));
  });

  it("reparte kg vivo/carne y canon de faena proporcionalmente entre categorías, ajustando la última para que sume exacto", async () => {
    const caso = construirCaso();
    const compraDosCategorias = compraAImportarBase({
      categorias: [
        { categoria: CategoriaPorcino.CAPON, cabezas: 80 },
        { categoria: CategoriaPorcino.MACHOS_ENTEROS_INMUNOCASTRADOS, cabezas: 80 },
      ],
      kgVivoTotalFaena: 100,
      kgCarneTotalFaena: 76.37,
      montoFaenaTotal: 100,
    });

    await caso.useCase.execute({ empresaId: EMPRESA_ID, compras: [compraDosCategorias] });

    const llamadasFaena = (caso.compraCategoriaRepository.actualizarFaena as ReturnType<typeof vi.fn>).mock.calls as [
      string,
      { kgVivoFaena: number; kgCarne: number },
    ][];
    expect(llamadasFaena).toHaveLength(2);
    const sumaKgVivo = llamadasFaena.reduce((acc, [, input]) => acc + input.kgVivoFaena, 0);
    const sumaKgCarne = llamadasFaena.reduce((acc, [, input]) => acc + input.kgCarne, 0);
    expect(sumaKgVivo).toBeCloseTo(100, 5);
    expect(sumaKgCarne).toBeCloseTo(76.37, 5);

    const llamadasCanon = (caso.compraCategoriaRepository.actualizarCanonFaena as ReturnType<typeof vi.fn>).mock.calls as [
      string,
      { canonFaenaSubtotal: number },
    ][];
    const sumaCanon = llamadasCanon.reduce((acc, [, input]) => acc + input.canonFaenaSubtotal, 0);
    expect(sumaCanon).toBeCloseTo(100, 5);
  });

  it("aísla las fallas: si una tropa falla, las demás se siguen procesando", async () => {
    const caso = construirCaso();
    (caso.compraRepository.create as ReturnType<typeof vi.fn>).mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    const compras = [
      compraAImportarBase({ fila: 1, numero: "falla" }),
      compraAImportarBase({ fila: 2, numero: "ok" }),
    ];

    const resultado = await caso.useCase.execute({ empresaId: EMPRESA_ID, compras });

    expect(resultado.creadas).toBe(1);
    expect(resultado.fallidas).toBe(1);
    expect(resultado.detalle).toEqual([
      { fila: 1, numero: "falla", ok: false, error: "boom" },
      { fila: 2, numero: "ok", ok: true, compraId: expect.any(String) },
    ]);
  });
});
