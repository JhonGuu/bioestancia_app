import { describe, expect, it, vi } from "vitest";

import { ConfirmarImportacionCobros } from "@/modules/cobros/use-cases/importar/confirmar-importacion-cobros.use-case";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { Cheque } from "@/modules/cheques/domain/cheque";
import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { CobroConLineas } from "@/modules/cobros/domain/cobro.repository";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { AplicarCobroFifo } from "@/modules/cobros/use-cases/aplicar-cobro-fifo.use-case";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { CargoAImportar, CobroAImportar } from "@/modules/cobros/domain/importacion-cobros";

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

function cobroBase(overrides: Partial<CobroAImportar> = {}): CobroAImportar {
  return {
    hoja: "Test Cliente",
    clienteId: "cliente-1",
    clienteEsNuevo: false,
    fila: 10,
    fecha: "2026-01-05",
    medioPago: MedioPago.EFECTIVO,
    monto: 1000,
    numeroCheque: null,
    bancoCheque: null,
    observaciones: null,
    ...overrides,
  };
}

function cargoBase(overrides: Partial<CargoAImportar> = {}): CargoAImportar {
  return {
    hoja: "Test Cliente",
    clienteId: "cliente-1",
    clienteEsNuevo: false,
    fila: 11,
    fecha: "2026-01-06",
    tipo: TipoCargo.OTRO,
    monto: 500,
    motivo: "Gasoil",
    esSaldoInicial: false,
    ...overrides,
  };
}

function construirCaso(opciones: { clientesExistentes?: Cliente[] } = {}) {
  const clientesExistentes = opciones.clientesExistentes ?? [cliente({ id: "cliente-1", razonSocial: "Test Cliente" })];

  const clienteRepository: Pick<ClienteRepository, "list" | "create"> = {
    list: vi.fn().mockResolvedValue(clientesExistentes),
    create: vi.fn().mockImplementation(async (input) => {
      const nuevo = cliente({ id: `cliente-nuevo-${clientesExistentes.length + 1}`, razonSocial: input.razonSocial ?? null });
      clientesExistentes.push(nuevo);
      return nuevo;
    }),
  };

  const chequeRepository: Pick<ChequeRepository, "create"> = {
    create: vi.fn().mockImplementation(
      async (input): Promise<Cheque> => ({
        id: `cheque-${Math.random()}`,
        estado: EstadoCheque.EN_CARTERA,
        fechaUltimoCambioEstado: new Date(),
        motivoRechazo: null,
        endosadoA: null,
        fechaEndoso: null,
        comentarios: null,
        cuitLibrador: null,
        titular: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...input,
      }),
    ),
  };

  const cobroRepository: Pick<CobroRepository, "create" | "crearAplicaciones"> = {
    create: vi.fn().mockImplementation(
      async (input): Promise<CobroConLineas> => ({
        id: `cobro-${Math.random()}`,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        comentarios: input.comentarios ?? null,
        empresaId: input.empresaId,
        clienteId: input.clienteId,
        fecha: input.fecha,
        lineas: input.lineas.map((l: unknown, i: number) => ({
          id: `linea-${i}-${Math.random()}`,
          cobroId: "n/a",
          createdAt: new Date(),
          bancoOBilletera: null,
          remitente: null,
          ...(l as object),
        })),
      }),
    ),
    crearAplicaciones: vi.fn().mockResolvedValue([]),
  };

  const aplicarCobroFifo: Pick<AplicarCobroFifo, "execute"> = {
    execute: vi.fn().mockResolvedValue([]),
  };

  const cargoCuentaCorrienteRepository: Pick<CargoCuentaCorrienteRepository, "create"> = {
    create: vi.fn().mockImplementation(
      async (input): Promise<CargoCuentaCorriente> => ({
        id: `cargo-${Math.random()}`,
        chequeId: null,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        motivo: input.motivo ?? null,
        ...input,
      }),
    ),
  };

  const useCase = new ConfirmarImportacionCobros(
    clienteRepository as ClienteRepository,
    chequeRepository as ChequeRepository,
    cobroRepository as CobroRepository,
    aplicarCobroFifo as AplicarCobroFifo,
    cargoCuentaCorrienteRepository as CargoCuentaCorrienteRepository,
  );

  return { useCase, clienteRepository, chequeRepository, cobroRepository, aplicarCobroFifo, cargoCuentaCorrienteRepository, clientesExistentes };
}

describe("ConfirmarImportacionCobros", () => {
  it("crea el cobro con su línea y aplica FIFO, persistiendo las aplicaciones calculadas", async () => {
    const { useCase, cobroRepository, aplicarCobroFifo } = construirCaso();
    (aplicarCobroFifo.execute as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ boletaId: "boleta-1", monto: 1000 }]);

    const resultado = await useCase.execute({ empresaId: EMPRESA_ID, cobros: [cobroBase()], cargos: [] });

    expect(resultado.creados).toBe(1);
    expect(resultado.fallidos).toBe(0);
    expect(cobroRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: EMPRESA_ID,
        clienteId: "cliente-1",
        lineas: [expect.objectContaining({ medioPago: MedioPago.EFECTIVO, monto: 1000, chequeId: null })],
      }),
    );
    expect(cobroRepository.crearAplicaciones).toHaveBeenCalledWith([
      expect.objectContaining({ boletaId: "boleta-1", monto: 1000 }),
    ]);
  });

  it("no persiste aplicaciones cuando el FIFO no devuelve nada (sin boletas pendientes)", async () => {
    const { useCase, cobroRepository } = construirCaso();

    await useCase.execute({ empresaId: EMPRESA_ID, cobros: [cobroBase()], cargos: [] });

    expect(cobroRepository.crearAplicaciones).not.toHaveBeenCalled();
  });

  it("crea el Cheque antes de la línea cuando el medioPago es CHEQUE/ECHEQ, con los datos mínimos que vinieron", async () => {
    const { useCase, chequeRepository, cobroRepository } = construirCaso();

    await useCase.execute({
      empresaId: EMPRESA_ID,
      cobros: [cobroBase({ medioPago: MedioPago.CHEQUE, monto: 20000, numeroCheque: "S/D (fila 10)", bancoCheque: "S/D" })],
      cargos: [],
    });

    expect(chequeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ numero: "S/D (fila 10)", banco: "S/D", monto: 20000, clienteId: "cliente-1" }),
    );
    expect(cobroRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ lineas: [expect.objectContaining({ medioPago: MedioPago.CHEQUE, chequeId: expect.stringMatching(/^cheque-/) })] }),
    );
  });

  it("crea el cargo directo vía el repositorio, sin pasar por CreateCargoCuentaCorriente", async () => {
    const { useCase, cargoCuentaCorrienteRepository } = construirCaso();

    const resultado = await useCase.execute({ empresaId: EMPRESA_ID, cobros: [], cargos: [cargoBase()] });

    expect(resultado.creados).toBe(1);
    expect(cargoCuentaCorrienteRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ empresaId: EMPRESA_ID, clienteId: "cliente-1", tipo: TipoCargo.OTRO, monto: 500 }),
    );
  });

  it("crea el cliente automáticamente cuando clienteId es null, cacheado por hoja", async () => {
    const { useCase, clienteRepository } = construirCaso({ clientesExistentes: [] });

    await useCase.execute({
      empresaId: EMPRESA_ID,
      cobros: [
        cobroBase({ hoja: "Cliente Nuevo", clienteId: null, clienteEsNuevo: true, fecha: "2026-01-05" }),
        cobroBase({ hoja: "Cliente Nuevo", clienteId: null, clienteEsNuevo: true, fecha: "2026-01-06" }),
      ],
      cargos: [],
    });

    expect(clienteRepository.create).toHaveBeenCalledTimes(1);
    expect(clienteRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ razonSocial: "Cliente Nuevo", condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL }),
    );
  });

  it("procesa cobros y cargos mezclados en orden cronológico estricto, sin importar el orden de entrada", async () => {
    const { useCase, aplicarCobroFifo } = construirCaso();

    await useCase.execute({
      empresaId: EMPRESA_ID,
      cobros: [cobroBase({ fila: 2, fecha: "2026-01-10", monto: 200 }), cobroBase({ fila: 1, fecha: "2026-01-05", monto: 100 })],
      cargos: [cargoBase({ fila: 3, fecha: "2026-01-07" })],
    });

    const montosEnOrden = (aplicarCobroFifo.execute as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0].montoDisponible);
    expect(montosEnOrden).toEqual([100, 200]); // el de 2026-01-05 se procesa antes que el de 2026-01-10
  });

  it("si falla un item, sigue procesando los demás y reporta cuál falló", async () => {
    const { useCase, cobroRepository } = construirCaso();
    (cobroRepository.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));

    const resultado = await useCase.execute({
      empresaId: EMPRESA_ID,
      cobros: [cobroBase({ fila: 1, fecha: "2026-01-05" }), cobroBase({ fila: 2, fecha: "2026-01-06" })],
      cargos: [],
    });

    expect(resultado.creados).toBe(1);
    expect(resultado.fallidos).toBe(1);
    expect(resultado.detalle.find((d) => d.fecha === "2026-01-05")?.ok).toBe(false);
    expect(resultado.detalle.find((d) => d.fecha === "2026-01-06")?.ok).toBe(true);
  });
});
