import { describe, expect, it, vi } from "vitest";

import { CerrarCompra } from "@/modules/compras/use-cases/cerrar-compra.use-case";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { Compra } from "@/modules/compras/domain/compra";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CompraCategoria } from "@/modules/compras/domain/compra-categoria";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { Venta } from "@/modules/ventas/domain/venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { GrupoTropasRepository } from "@/modules/grupos-tropas/domain/grupo-tropas.repository";
import { GrupoTropas } from "@/modules/grupos-tropas/domain/grupo-tropas";

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
    pesoBruto: 13000,
    pesoNeto: 12220,
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

function venta(overrides: Partial<Venta> & Pick<Venta, "compraId" | "kg">): Venta {
  return {
    id: `venta-${Math.random()}`,
    empresaId: EMPRESA_ID,
    clienteId: "cliente-1",
    boletaId: "boleta-1",
    garron: null,
    formaVenta: FormaVenta.CABEZA,
    categoria: CategoriaPorcino.CAPON,
    precioKg: null,
    total: null,
    fecha: new Date("2026-01-10"),
    clienteFinalId: null,
    comentarios: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function construirCaso(opciones: {
  compra?: Compra;
  categorias?: CompraCategoria[];
  ventas?: Venta[];
  grupo?: GrupoTropas | null;
} = {}) {
  const compraExistente = opciones.compra ?? compra({ id: "compra-1" });
  const categorias = opciones.categorias ?? [categoria({ compraId: "compra-1", cabezas: 100 })];
  const ventas =
    opciones.ventas ?? Array.from({ length: 100 }, (_, i) => venta({ compraId: "compra-1", garron: i + 1, kg: 122 }));

  const compraRepository: Partial<CompraRepository> = {
    getById: vi.fn().mockResolvedValue(compraExistente),
    cerrar: vi.fn().mockImplementation(async (id, _empresaId, input) => ({ ...compraExistente, cerrada: true, ...input })),
  };

  const compraCategoriaRepository: Partial<CompraCategoriaRepository> = {
    listByCompra: vi.fn().mockResolvedValue(categorias),
  };

  const ventaRepository: Partial<VentaRepository> = {
    listByCompra: vi.fn().mockResolvedValue(ventas),
  };

  const grupoTropasRepository: Partial<GrupoTropasRepository> = {
    getById: vi.fn().mockResolvedValue(opciones.grupo ?? null),
  };

  const useCase = new CerrarCompra(
    compraRepository as CompraRepository,
    compraCategoriaRepository as CompraCategoriaRepository,
    ventaRepository as VentaRepository,
    grupoTropasRepository as GrupoTropasRepository,
  );

  return { useCase, compraRepository, compraCategoriaRepository, ventaRepository, grupoTropasRepository };
}

describe("CerrarCompra", () => {
  it("cierra y calcula el rinde cuando las cabezas vendidas coinciden con las compradas", async () => {
    const { useCase, compraRepository } = construirCaso();

    const resultado = await useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID });

    expect(compraRepository.cerrar).toHaveBeenCalledWith(
      "compra-1",
      EMPRESA_ID,
      expect.objectContaining({ pesoFinalVenta: 12200, alertaSuperavit: false }),
    );
    expect(resultado.cerrada).toBe(true);
  });

  it("bloquea el cierre si las cabezas vendidas son menos que las compradas", async () => {
    const { useCase } = construirCaso({
      ventas: Array.from({ length: 99 }, (_, i) => venta({ compraId: "compra-1", garron: i + 1, kg: 122 })),
    });

    await expect(useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID })).rejects.toThrow(/son menos que/);
  });

  it("deja cerrar con alertaSuperavit cuando las cabezas vendidas superan a las compradas", async () => {
    const { useCase, compraRepository } = construirCaso({
      ventas: Array.from({ length: 101 }, (_, i) => venta({ compraId: "compra-1", garron: i + 1, kg: 122 })),
    });

    const resultado = await useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID });

    expect(resultado.alertaSuperavit).toBe(true);
    expect(compraRepository.cerrar).toHaveBeenCalledWith(
      "compra-1",
      EMPRESA_ID,
      expect.objectContaining({ alertaSuperavit: true }),
    );
  });

  it("rechaza el cierre individual si la tropa pertenece a un grupo todavía abierto", async () => {
    const { useCase } = construirCaso({
      compra: compra({ id: "compra-1", grupoTropasId: "grupo-1" }),
      grupo: {
        id: "grupo-1",
        empresaId: EMPRESA_ID,
        nombre: null,
        pesoBrutoTotal: 100,
        pesoNetoTotal: 90,
        cerrado: false,
        fechaCierre: null,
        pesoFinalVentaTotal: null,
        rinde: null,
        alertaSuperavit: false,
        comentarios: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await expect(useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID })).rejects.toThrow(/grupo de tropas abierto/);
  });

  it("permite el cierre individual si la tropa pertenece a un grupo ya cerrado (no debería llegar acá, pero no explota)", async () => {
    const { useCase } = construirCaso({
      compra: compra({ id: "compra-1", grupoTropasId: "grupo-1" }),
      grupo: {
        id: "grupo-1",
        empresaId: EMPRESA_ID,
        nombre: null,
        pesoBrutoTotal: 100,
        pesoNetoTotal: 90,
        cerrado: true,
        fechaCierre: new Date(),
        pesoFinalVentaTotal: 90,
        rinde: 100,
        alertaSuperavit: false,
        comentarios: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await expect(useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID })).resolves.toBeDefined();
  });
});
