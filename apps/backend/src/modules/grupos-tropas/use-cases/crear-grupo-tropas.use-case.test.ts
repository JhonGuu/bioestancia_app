import { describe, expect, it, vi } from "vitest";

import { CrearGrupoTropas } from "@/modules/grupos-tropas/use-cases/crear-grupo-tropas.use-case";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { Compra } from "@/modules/compras/domain/compra";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";
import { UpdateCompra } from "@/modules/compras/use-cases/update-compra.use-case";

const EMPRESA_ID = "empresa-1";

function compra(overrides: Partial<Compra> & Pick<Compra, "id">): Compra {
  return {
    empresaId: EMPRESA_ID,
    proveedorId: "prov-1",
    numero: "100",
    especie: EspecieAnimal.PORCINO,
    letra: null,
    fecha: new Date("2026-01-01"),
    dte: "032369757-4",
    remito: "0001-000100",
    porcentajeDesbaste: 6,
    precioCompraKg: 1500,
    pesoBruto: 15000,
    pesoNeto: 14100,
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

function categoria(overrides: Partial<CompraCategoria> & Pick<CompraCategoria, "compraId" | "cabezas">): CompraCategoria {
  return {
    id: `cat-${Math.random()}`,
    categoria: CategoriaPorcino.CAPON,
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

function grupoTropas(overrides: Partial<GrupoTropas> & Pick<GrupoTropas, "id">): GrupoTropas {
  return {
    empresaId: EMPRESA_ID,
    nombre: null,
    pesoBrutoTotal: 0,
    pesoNetoTotal: 0,
    cerrado: false,
    fechaCierre: null,
    pesoFinalVentaTotal: null,
    rinde: null,
    alertaSuperavit: false,
    comentarios: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function construirCaso(opciones: { compras?: Compra[]; categoriasPorCompra?: Record<string, CompraCategoria[]> } = {}) {
  const compras =
    opciones.compras ??
    // 100 animales en la tropa original (14.100 kg netos) + 1 animal de más
    // en una tropa nueva — el caso real de Motape descripto por Juan Jose.
    [
      compra({ id: "compra-1", numero: "100", pesoBruto: 15000, pesoNeto: 14100, porcentajeDesbaste: 6 }),
      compra({ id: "compra-2", numero: "100-B", pesoBruto: 150, pesoNeto: 141, porcentajeDesbaste: 6 }),
    ];
  const categoriasPorCompra =
    opciones.categoriasPorCompra ??
    {
      "compra-1": [categoria({ compraId: "compra-1", cabezas: 100 })],
      "compra-2": [categoria({ compraId: "compra-2", cabezas: 1 })],
    };

  const compraRepository: Partial<CompraRepository> = {
    getById: vi.fn().mockImplementation(async (id: string) => compras.find((c) => c.id === id) ?? null),
    asignarGrupo: vi.fn().mockImplementation(async (id: string, _empresaId: string, grupoTropasId: string | null) => {
      const c = compras.find((x) => x.id === id)!;
      return { ...c, grupoTropasId };
    }),
  };

  const compraCategoriaRepository: Partial<CompraCategoriaRepository> = {
    listByCompra: vi.fn().mockImplementation(async (compraId: string) => categoriasPorCompra[compraId] ?? []),
  };

  const grupoTropasRepository: Partial<GrupoTropasRepository> = {
    create: vi.fn().mockImplementation(async (input) => grupoTropas({ id: "grupo-1", ...input })),
  };

  const updateCompra: Partial<UpdateCompra> = {
    execute: vi.fn().mockImplementation(async (input: { id: string; pesoBruto?: number }) => {
      const c = compras.find((x) => x.id === input.id)!;
      const pesoBruto = input.pesoBruto ?? c.pesoBruto;
      const pesoNeto = Math.round(pesoBruto * (1 - c.porcentajeDesbaste / 100) * 100) / 100;
      return { ...c, pesoBruto, pesoNeto, categorias: [] };
    }),
  };

  const useCase = new CrearGrupoTropas(
    compraRepository as CompraRepository,
    compraCategoriaRepository as CompraCategoriaRepository,
    grupoTropasRepository as GrupoTropasRepository,
    updateCompra as UpdateCompra,
  );

  return { useCase, compraRepository, compraCategoriaRepository, grupoTropasRepository, updateCompra, compras };
}

describe("CrearGrupoTropas", () => {
  it("reparte el peso proporcional a las cabezas de cada tropa y arma el grupo", async () => {
    const { useCase, grupoTropasRepository, updateCompra } = construirCaso();

    const resultado = await useCase.execute({
      empresaId: EMPRESA_ID,
      compraIds: ["compra-1", "compra-2"],
      pesoBrutoTotal: 15150, // los 15000 originales + un poco por el animal de más
    });

    // 100 cabezas de 101 totales → 100/101 * 15150 ≈ 15000; el resto (residuo) a la última línea.
    expect(updateCompra.execute).toHaveBeenNthCalledWith(1, { id: "compra-1", empresaId: EMPRESA_ID, pesoBruto: 15000 });
    expect(updateCompra.execute).toHaveBeenNthCalledWith(2, { id: "compra-2", empresaId: EMPRESA_ID, pesoBruto: 150 });

    expect(grupoTropasRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ empresaId: EMPRESA_ID, pesoBrutoTotal: 15150 }),
    );
    expect(resultado.compras).toHaveLength(2);
    expect(resultado.compras.every((c) => c.grupoTropasId === "grupo-1")).toBe(true);
  });

  it("rechaza armar un grupo con menos de 2 tropas", async () => {
    const { useCase } = construirCaso();

    await expect(
      useCase.execute({ empresaId: EMPRESA_ID, compraIds: ["compra-1"], pesoBrutoTotal: 15000 }),
    ).rejects.toThrow(/al menos 2 tropas/);
  });

  it("rechaza agrupar una tropa ya cerrada", async () => {
    const { useCase } = construirCaso({
      compras: [
        compra({ id: "compra-1", cerrada: true }),
        compra({ id: "compra-2" }),
      ],
    });

    await expect(
      useCase.execute({ empresaId: EMPRESA_ID, compraIds: ["compra-1", "compra-2"], pesoBrutoTotal: 15000 }),
    ).rejects.toThrow(/ya está cerrada/);
  });

  it("rechaza agrupar una tropa que ya pertenece a otro grupo", async () => {
    const { useCase } = construirCaso({
      compras: [
        compra({ id: "compra-1", grupoTropasId: "otro-grupo" }),
        compra({ id: "compra-2" }),
      ],
    });

    await expect(
      useCase.execute({ empresaId: EMPRESA_ID, compraIds: ["compra-1", "compra-2"], pesoBrutoTotal: 15000 }),
    ).rejects.toThrow(/ya pertenece a otro grupo/);
  });
});
