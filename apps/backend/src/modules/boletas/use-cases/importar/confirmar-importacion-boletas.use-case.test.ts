import { describe, expect, it, vi } from "vitest";

import { ConfirmarImportacionBoletas } from "@/modules/boletas/use-cases/importar/confirmar-importacion-boletas.use-case";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { CreateVenta } from "@/modules/ventas/use-cases/create-venta.use-case";
import { Venta } from "@/modules/ventas/domain/venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { BoletaAImportar } from "@/modules/boletas/domain/importacion-boletas";

const EMPRESA_ID = "empresa-1";

function cliente(overrides: Partial<Cliente> & Pick<Cliente, "id">): Cliente {
  return {
    empresaId: EMPRESA_ID,
    listaDePreciosId: null,
    nombre: null,
    apellido: null,
    razonSocial: "Cliente de prueba",
    cuit: null,
    dni: null,
    domicilio: null,
    email: null,
    pais: null,
    provincia: null,
    ubicacion: null,
    condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    esRevendedor: false,
    diasPlazoPago: null,
    descuentoKgPorCabeza: null,
    metaCabezasSemanales: null,
    activo: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function boletaPersistida(overrides: Partial<Boleta> = {}): Boleta {
  return {
    id: `boleta-${Math.random()}`,
    empresaId: EMPRESA_ID,
    clienteId: "cliente-1",
    fecha: new Date("2026-01-05"),
    fechaVencimiento: new Date("2026-01-12"),
    numero: null,
    comentarios: null,
    activo: true,
    createdAt: new Date("2026-01-05"),
    updatedAt: new Date("2026-01-05"),
    ...overrides,
  };
}

function grupo(overrides: Partial<BoletaAImportar> = {}): BoletaAImportar {
  return {
    hoja: "Test Cliente",
    clienteId: "cliente-1",
    clienteEsNuevo: false,
    fecha: "2026-01-05",
    filas: [13, 14],
    ventas: [
      { fila: 13, formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CAPON, kg: 100, precioKg: 3250, observaciones: null },
    ],
    totalImporte: 325000,
    ...overrides,
  };
}

function construirCaso(opciones: { clientesExistentes?: Cliente[] } = {}) {
  const clientesExistentes = opciones.clientesExistentes ?? [cliente({ id: "cliente-1", razonSocial: "Test Cliente" })];

  const clienteRepository: Pick<ClienteRepository, "list" | "getById" | "create"> = {
    list: vi.fn().mockResolvedValue(clientesExistentes),
    getById: vi.fn().mockImplementation(async (id: string) => clientesExistentes.find((c) => c.id === id) ?? null),
    create: vi.fn().mockImplementation(async (input) => {
      const nuevo = cliente({ id: `cliente-nuevo-${clientesExistentes.length + 1}`, razonSocial: input.razonSocial ?? null });
      clientesExistentes.push(nuevo);
      return nuevo;
    }),
  };

  const boletaRepository: Pick<BoletaRepository, "create"> = {
    create: vi.fn().mockImplementation(async (input) => boletaPersistida(input)),
  };

  const createVenta: Pick<CreateVenta, "execute"> = {
    execute: vi.fn().mockImplementation(async (input) => ({ id: `venta-${Math.random()}`, ...input }) as unknown as Venta),
  };

  const useCase = new ConfirmarImportacionBoletas(
    clienteRepository as ClienteRepository,
    boletaRepository as BoletaRepository,
    createVenta as CreateVenta,
  );

  return { useCase, clienteRepository, boletaRepository, createVenta, clientesExistentes };
}

describe("ConfirmarImportacionBoletas", () => {
  it("crea la boleta y una venta por cada línea del grupo, con precioKg ya cargado", async () => {
    const { useCase, boletaRepository, createVenta } = construirCaso();

    const resultado = await useCase.execute({ empresaId: EMPRESA_ID, boletas: [grupo()] });

    expect(resultado.creadas).toBe(1);
    expect(resultado.fallidas).toBe(0);
    expect(boletaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ empresaId: EMPRESA_ID, clienteId: "cliente-1", comentarios: expect.stringContaining("Test Cliente") }),
    );
    expect(createVenta.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        formaVenta: FormaVenta.CABEZA,
        categoria: CategoriaPorcino.CAPON,
        kg: 100,
        precioKg: 3250,
        compraId: null,
        garron: null,
        clienteFinalId: null,
      }),
    );
  });

  it("crea el cliente automáticamente cuando el grupo trae clienteId null, con razonSocial = nombre de la hoja", async () => {
    const { useCase, clienteRepository, boletaRepository } = construirCaso({ clientesExistentes: [] });

    const resultado = await useCase.execute({
      empresaId: EMPRESA_ID,
      boletas: [grupo({ hoja: "Cliente Nuevo", clienteId: null, clienteEsNuevo: true })],
    });

    expect(resultado.creadas).toBe(1);
    expect(clienteRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ empresaId: EMPRESA_ID, razonSocial: "Cliente Nuevo", condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL }),
    );
    expect(boletaRepository.create).toHaveBeenCalledWith(expect.objectContaining({ clienteId: expect.stringMatching(/^cliente-nuevo-/) }));
  });

  it("crea el cliente nuevo UNA sola vez aunque la misma hoja tenga varios grupos (varios días)", async () => {
    const { useCase, clienteRepository } = construirCaso({ clientesExistentes: [] });

    await useCase.execute({
      empresaId: EMPRESA_ID,
      boletas: [
        grupo({ hoja: "Cliente Nuevo", clienteId: null, clienteEsNuevo: true, fecha: "2026-01-05" }),
        grupo({ hoja: "Cliente Nuevo", clienteId: null, clienteEsNuevo: true, fecha: "2026-01-06" }),
      ],
    });

    expect(clienteRepository.create).toHaveBeenCalledTimes(1);
  });

  it("si falla un grupo, sigue procesando los demás y reporta cuál falló", async () => {
    const { useCase, boletaRepository } = construirCaso();
    (boletaRepository.create as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("boom"))
      .mockImplementationOnce(async (input) => boletaPersistida(input));

    const resultado = await useCase.execute({
      empresaId: EMPRESA_ID,
      boletas: [grupo({ fecha: "2026-01-05" }), grupo({ fecha: "2026-01-06" })],
    });

    expect(resultado.creadas).toBe(1);
    expect(resultado.fallidas).toBe(1);
    expect(resultado.detalle.find((d) => d.fecha === "2026-01-05")?.ok).toBe(false);
    expect(resultado.detalle.find((d) => d.fecha === "2026-01-06")?.ok).toBe(true);
  });
});
