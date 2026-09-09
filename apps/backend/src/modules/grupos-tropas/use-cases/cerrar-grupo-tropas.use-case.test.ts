import { describe, expect, it, vi } from "vitest";

import { CerrarGrupoTropas } from "@/modules/grupos-tropas/use-cases/cerrar-grupo-tropas.use-case";
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
    pesoBruto: 15000,
    pesoNeto: 14100,
    cerrada: false,
    fechaCierre: null,
    pesoFinalVenta: null,
    rinde: null,
    grupoTropasId: "grupo-1",
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

function grupoTropas(overrides: Partial<GrupoTropas> & Pick<GrupoTropas, "id">): GrupoTropas {
  return {
    empresaId: EMPRESA_ID,
    nombre: null,
    pesoBrutoTotal: 15150,
    pesoNetoTotal: 14241,
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

function construirCaso(opciones: {
  grupo?: GrupoTropas;
  miembros?: Compra[];
  categoriasPorCompra?: Record<string, CompraCategoria[]>;
  ventasPorCompra?: Record<string, Venta[]>;
} = {}) {
  const grupo = opciones.grupo ?? grupoTropas({ id: "grupo-1" });
  const miembros =
    opciones.miembros ??
    [compra({ id: "compra-1" }), compra({ id: "compra-2", numero: "100-B" })];
  const categoriasPorCompra =
    opciones.categoriasPorCompra ??
    {
      "compra-1": [categoria({ compraId: "compra-1", cabezas: 100 })],
      "compra-2": [categoria({ compraId: "compra-2", cabezas: 1 })],
    };
  const ventasPorCompra =
    opciones.ventasPorCompra ??
    {
      "compra-1": Array.from({ length: 100 }, (_, i) =>
        venta({ compraId: "compra-1", garron: i + 1, kg: 130 }),
      ),
      "compra-2": [venta({ compraId: "compra-2", garron: 101, kg: 130 })],
    };

  const grupoTropasRepository: Partial<GrupoTropasRepository> = {
    getById: vi.fn().mockResolvedValue(grupo),
    cerrar: vi.fn().mockImplementation(async (id, _empresaId, input) => ({ ...grupo, cerrado: true, ...input })),
  };

  const compraRepository: Partial<CompraRepository> = {
    listByGrupo: vi.fn().mockResolvedValue(miembros),
    cerrar: vi.fn().mockImplementation(async (id: string, _empresaId: string, input) => {
      const c = miembros.find((m) => m.id === id)!;
      return { ...c, cerrada: true, ...input };
    }),
  };

  const compraCategoriaRepository: Partial<CompraCategoriaRepository> = {
    listByCompra: vi.fn().mockImplementation(async (compraId: string) => categoriasPorCompra[compraId] ?? []),
  };

  const ventaRepository: Partial<VentaRepository> = {
    listByCompra: vi.fn().mockImplementation(async (compraId: string) => ventasPorCompra[compraId] ?? []),
  };

  const useCase = new CerrarGrupoTropas(
    grupoTropasRepository as GrupoTropasRepository,
    compraRepository as CompraRepository,
    compraCategoriaRepository as CompraCategoriaRepository,
    ventaRepository as VentaRepository,
  );

  return { useCase, grupoTropasRepository, compraRepository, compraCategoriaRepository, ventaRepository };
}

describe("CerrarGrupoTropas", () => {
  it("reconcilia cabezas SUMADAS de todas las tropas del grupo y calcula un único rinde", async () => {
    const { useCase, grupoTropasRepository, compraRepository } = construirCaso();

    const resultado = await useCase.execute({ id: "grupo-1", empresaId: EMPRESA_ID });

    // 101 cabezas compradas = 101 vendidas (garrones 1..101) → sin alerta.
    // pesoFinalVentaTotal = 101 * 130 = 13130; rinde = 13130/14241*100 ≈ 92.20.
    expect(grupoTropasRepository.cerrar).toHaveBeenCalledWith(
      "grupo-1",
      EMPRESA_ID,
      expect.objectContaining({ pesoFinalVentaTotal: 13130, alertaSuperavit: false }),
    );
    expect(resultado.rinde).toBeCloseTo(92.2, 1);

    // Cada miembro queda cerrado con SU parte del peso, pero sin rinde propio.
    expect(compraRepository.cerrar).toHaveBeenCalledWith(
      "compra-1",
      EMPRESA_ID,
      expect.objectContaining({ pesoFinalVenta: 13000, rinde: null }),
    );
    expect(compraRepository.cerrar).toHaveBeenCalledWith(
      "compra-2",
      EMPRESA_ID,
      expect.objectContaining({ pesoFinalVenta: 130, rinde: null }),
    );
  });

  it("bloquea el cierre si las cabezas vendidas del grupo son menos que las compradas", async () => {
    const { useCase } = construirCaso({
      ventasPorCompra: {
        "compra-1": Array.from({ length: 99 }, (_, i) => venta({ compraId: "compra-1", garron: i + 1, kg: 130 })),
        "compra-2": [venta({ compraId: "compra-2", garron: 101, kg: 130 })],
      },
    });

    await expect(useCase.execute({ id: "grupo-1", empresaId: EMPRESA_ID })).rejects.toThrow(
      /menos que las compradas/,
    );
  });

  it("deja cerrar con alertaSuperavit cuando las cabezas vendidas del grupo superan a las compradas", async () => {
    const { useCase, grupoTropasRepository } = construirCaso({
      ventasPorCompra: {
        "compra-1": Array.from({ length: 100 }, (_, i) => venta({ compraId: "compra-1", garron: i + 1, kg: 130 })),
        "compra-2": [
          venta({ compraId: "compra-2", garron: 101, kg: 130 }),
          venta({ compraId: "compra-2", garron: 102, kg: 130 }), // cabeza de más, sin DTE
        ],
      },
    });

    const resultado = await useCase.execute({ id: "grupo-1", empresaId: EMPRESA_ID });

    expect(resultado.alertaSuperavit).toBe(true);
    expect(grupoTropasRepository.cerrar).toHaveBeenCalledWith(
      "grupo-1",
      EMPRESA_ID,
      expect.objectContaining({ alertaSuperavit: true }),
    );
  });

  it("rechaza cerrar un grupo ya cerrado", async () => {
    const { useCase } = construirCaso({ grupo: grupoTropas({ id: "grupo-1", cerrado: true }) });

    await expect(useCase.execute({ id: "grupo-1", empresaId: EMPRESA_ID })).rejects.toThrow(/ya está cerrado/);
  });
});
