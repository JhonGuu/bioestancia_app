import { describe, expect, it, vi } from "vitest";

import { ReabrirCompra } from "@/modules/compras/use-cases/reabrir-compra.use-case";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { Compra } from "@/modules/compras/domain/compra";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
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
    cerrada: true,
    fechaCierre: new Date(),
    pesoFinalVenta: 12200,
    rinde: 99.84,
    grupoTropasId: null,
    alertaSuperavit: false,
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
    ...overrides,
  };
}

function construirCaso(opciones: { compra?: Compra; grupo?: GrupoTropas | null } = {}) {
  const compraExistente = opciones.compra ?? compra({ id: "compra-1" });

  const compraRepository: Partial<CompraRepository> = {
    getById: vi.fn().mockResolvedValue(compraExistente),
    reabrir: vi.fn().mockResolvedValue({ ...compraExistente, cerrada: false }),
  };

  const grupoTropasRepository: Partial<GrupoTropasRepository> = {
    getById: vi.fn().mockResolvedValue(opciones.grupo ?? null),
  };

  const useCase = new ReabrirCompra(compraRepository as CompraRepository, grupoTropasRepository as GrupoTropasRepository);

  return { useCase, compraRepository, grupoTropasRepository };
}

describe("ReabrirCompra", () => {
  it("reabre una compra cerrada sin grupo", async () => {
    const { useCase, compraRepository } = construirCaso();

    const resultado = await useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID });

    expect(compraRepository.reabrir).toHaveBeenCalledWith("compra-1", EMPRESA_ID);
    expect(resultado.cerrada).toBe(false);
  });

  it("rechaza reabrir una compra que no está cerrada", async () => {
    const { useCase } = construirCaso({ compra: compra({ id: "compra-1", cerrada: false }) });

    await expect(useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID })).rejects.toThrow(/no está cerrada/);
  });

  it("rechaza el reabrir individual si la tropa pertenece a un grupo cerrado", async () => {
    const { useCase } = construirCaso({
      compra: compra({ id: "compra-1", grupoTropasId: "grupo-1" }),
      grupo: grupoTropas({ id: "grupo-1", cerrado: true }),
    });

    await expect(useCase.execute({ id: "compra-1", empresaId: EMPRESA_ID })).rejects.toThrow(/reabrí el grupo completo/);
  });
});
