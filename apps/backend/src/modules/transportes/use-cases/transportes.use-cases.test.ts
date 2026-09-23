import { describe, expect, it, vi } from "vitest";

import { ApiError, Code } from "@/shared/infra/http/api.responses";
import { Chofer } from "@/modules/transportes/domain/chofer";
import { ChoferRepository } from "@/modules/transportes/domain/chofer.repository";
import { ocultarDatosPersonales } from "@/modules/transportes/domain/chofer-privacidad";
import { Transportista } from "@/modules/transportes/domain/transportista";
import { TransportistaRepository } from "@/modules/transportes/domain/transportista.repository";
import { TipoVehiculo, Vehiculo } from "@/modules/transportes/domain/vehiculo";
import { VehiculoRepository } from "@/modules/transportes/domain/vehiculo.repository";
import { TransporteClienteRepository } from "@/modules/transportes/domain/transporte-cliente.repository";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CreateChofer, UpdateChofer } from "@/modules/transportes/use-cases/chofer.use-cases";
import { CreateTransportista, UpdateTransportista } from "@/modules/transportes/use-cases/transportista.use-cases";
import { CreateVehiculo, UpdateVehiculo } from "@/modules/transportes/use-cases/vehiculo.use-cases";
import {
  GetTransporteCliente,
  SetTransporteCliente,
} from "@/modules/transportes/use-cases/transporte-cliente.use-cases";

const EMPRESA = "empresa-1";
const AHORA = new Date("2026-09-23");

function transportista(overrides: Partial<Transportista> = {}): Transportista {
  return {
    id: "t1",
    empresaId: EMPRESA,
    nombre: "El Meridiano S.A.S.",
    cuit: "30716873974",
    telefono: null,
    esPropio: true,
    activo: true,
    createdAt: AHORA,
    updatedAt: AHORA,
    ...overrides,
  };
}

function chofer(overrides: Partial<Chofer> = {}): Chofer {
  return {
    id: "c1",
    empresaId: EMPRESA,
    transportistaId: null,
    nombre: "Facundo",
    apellido: "Villafañe",
    cuit: "20423341379",
    dni: "42334137",
    telefono: null,
    licenciaVencimiento: "2027-05-01",
    activo: true,
    createdAt: AHORA,
    updatedAt: AHORA,
    ...overrides,
  };
}

function vehiculo(overrides: Partial<Vehiculo> = {}): Vehiculo {
  return {
    id: "v1",
    empresaId: EMPRESA,
    transportistaId: null,
    tipo: TipoVehiculo.CAMION,
    patente: "AG469HW",
    descripcion: null,
    rtoVencimiento: null,
    seguroVencimiento: null,
    habilitacionAnimalesVencimiento: null,
    activo: true,
    createdAt: AHORA,
    updatedAt: AHORA,
    ...overrides,
  };
}

async function fallaCon(promesa: Promise<unknown>, code: Code): Promise<ApiError> {
  const error = await promesa.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(code);
  return error as ApiError;
}

describe("Transportistas", () => {
  function armar(existente: Transportista | null) {
    const create = vi.fn(async (input) => transportista({ ...input }));
    const update = vi.fn(async (_id, _empresa, input) => transportista({ ...input }));
    const repo = {
      findByCuit: vi.fn().mockResolvedValue(existente),
      create,
      update,
    } as unknown as TransportistaRepository;
    return { repo, create, update };
  }

  it("guarda el CUIT sin guiones y el nombre sin espacios sobrantes", async () => {
    const { repo, create } = armar(null);
    await new CreateTransportista(repo).execute({
      empresaId: EMPRESA,
      nombre: "  Fletes Cuyo S.R.L. ",
      cuit: "30-71687397-4",
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: "Fletes Cuyo S.R.L.", cuit: "30716873974" }),
    );
  });

  it("rechaza con 409 un CUIT que ya existe en la empresa, y avisa si está inactivo", async () => {
    const { repo, create } = armar(transportista({ activo: false }));
    const error = await fallaCon(
      new CreateTransportista(repo).execute({ empresaId: EMPRESA, nombre: "X", cuit: "30716873974" }),
      Code.CONFLICT,
    );
    expect(error.message).toContain("inactivo");
    expect(create).not.toHaveBeenCalled();
  });

  it("al editar, no considera duplicado el CUIT del propio registro", async () => {
    const { repo, update } = armar(transportista({ id: "t1" }));
    await new UpdateTransportista(repo).execute({
      id: "t1",
      empresaId: EMPRESA,
      nombre: "Nuevo nombre",
      cuit: "30716873974",
    });
    expect(update).toHaveBeenCalled();
  });

  it("al editar, rechaza el CUIT de otro transportista", async () => {
    const { repo, update } = armar(transportista({ id: "otro" }));
    await fallaCon(
      new UpdateTransportista(repo).execute({ id: "t1", empresaId: EMPRESA, nombre: "X", cuit: "30716873974" }),
      Code.CONFLICT,
    );
    expect(update).not.toHaveBeenCalled();
  });
});

describe("Choferes", () => {
  function armar(opts: { existentePorCuit?: Chofer | null; porId?: Chofer | null; transportista?: Transportista | null } = {}) {
    const create = vi.fn(async (input) => chofer({ ...input }));
    const update = vi.fn(async (_id, _empresa, input) => chofer({ ...input }));
    const repo = {
      findByCuit: vi.fn().mockResolvedValue(opts.existentePorCuit ?? null),
      getById: vi.fn().mockResolvedValue(opts.porId ?? null),
      create,
      update,
    } as unknown as ChoferRepository;
    const transportistaRepo = {
      getById: vi.fn().mockResolvedValue(opts.transportista ?? null),
    } as unknown as TransportistaRepository;
    return { repo, transportistaRepo, create, update };
  }

  it("crea el chofer normalizando el CUIT", async () => {
    const { repo, transportistaRepo, create } = armar();
    await new CreateChofer(repo, transportistaRepo).execute({
      empresaId: EMPRESA,
      nombre: " Facundo ",
      apellido: "Villafañe",
      cuit: "20-42334137-9",
    });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ nombre: "Facundo", cuit: "20423341379" }));
  });

  it("rechaza un transportista que no es de la empresa", async () => {
    const { repo, transportistaRepo, create } = armar({ transportista: null });
    await fallaCon(
      new CreateChofer(repo, transportistaRepo).execute({
        empresaId: EMPRESA,
        transportistaId: "ajeno",
        nombre: "A",
        apellido: "B",
        cuit: "20423341379",
      }),
      Code.BAD_REQUEST,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("rechaza con 409 un CUIT de chofer repetido", async () => {
    const { repo, transportistaRepo } = armar({ existentePorCuit: chofer() });
    await fallaCon(
      new CreateChofer(repo, transportistaRepo).execute({
        empresaId: EMPRESA,
        nombre: "A",
        apellido: "B",
        cuit: "20423341379",
      }),
      Code.CONFLICT,
    );
  });

  it("sin permiso para ver datos personales, editar conserva el DNI y la licencia guardados", async () => {
    const { repo, transportistaRepo, update } = armar({
      existentePorCuit: chofer(),
      porId: chofer({ dni: "42334137", licenciaVencimiento: "2027-05-01" }),
    });

    await new UpdateChofer(repo, transportistaRepo).execute({
      id: "c1",
      empresaId: EMPRESA,
      puedeVerDatosPersonales: false,
      nombre: "Facundo Enrique",
      apellido: "Villafañe",
      cuit: "20423341379",
      dni: undefined,
      licenciaVencimiento: undefined,
    });

    expect(update).toHaveBeenCalledWith(
      "c1",
      EMPRESA,
      expect.objectContaining({
        nombre: "Facundo Enrique",
        dni: "42334137",
        licenciaVencimiento: "2027-05-01",
      }),
    );
  });

  it("con permiso, editar reemplaza el DNI y la licencia por lo que viene", async () => {
    const { repo, transportistaRepo, update } = armar({ existentePorCuit: chofer() });

    await new UpdateChofer(repo, transportistaRepo).execute({
      id: "c1",
      empresaId: EMPRESA,
      puedeVerDatosPersonales: true,
      nombre: "Facundo",
      apellido: "Villafañe",
      cuit: "20423341379",
      dni: "99999999",
      licenciaVencimiento: undefined,
    });

    expect(update).toHaveBeenCalledWith(
      "c1",
      EMPRESA,
      expect.objectContaining({ dni: "99999999", licenciaVencimiento: undefined }),
    );
  });

  it("ocultarDatosPersonales borra DNI y licencia pero deja el CUIT", () => {
    const oculto = ocultarDatosPersonales(chofer());
    expect(oculto.dni).toBeNull();
    expect(oculto.licenciaVencimiento).toBeNull();
    expect(oculto.cuit).toBe("20423341379");
  });
});

describe("Vehículos", () => {
  function armar(opts: { existente?: Vehiculo | null; transportista?: Transportista | null } = {}) {
    const create = vi.fn(async (input) => vehiculo({ ...input }));
    const update = vi.fn(async (_id, _empresa, input) => vehiculo({ ...input }));
    const repo = {
      findByPatente: vi.fn().mockResolvedValue(opts.existente ?? null),
      create,
      update,
    } as unknown as VehiculoRepository;
    const transportistaRepo = {
      getById: vi.fn().mockResolvedValue(opts.transportista ?? null),
    } as unknown as TransportistaRepository;
    return { repo, transportistaRepo, create, update };
  }

  it("guarda la patente normalizada", async () => {
    const { repo, transportistaRepo, create } = armar();
    await new CreateVehiculo(repo, transportistaRepo).execute({
      empresaId: EMPRESA,
      tipo: TipoVehiculo.CAMION,
      patente: "ag 469-hw",
    });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ patente: "AG469HW" }));
  });

  it("rechaza con 409 una patente repetida, aunque venga con otro formato de escritura", async () => {
    const { repo, transportistaRepo, create } = armar({ existente: vehiculo({ activo: false }) });
    const error = await fallaCon(
      new CreateVehiculo(repo, transportistaRepo).execute({
        empresaId: EMPRESA,
        tipo: TipoVehiculo.JAULA,
        patente: "ag-469-hw",
      }),
      Code.CONFLICT,
    );
    expect(error.message).toContain("inactivo");
    expect(create).not.toHaveBeenCalled();
  });

  it("al editar puede conservar su propia patente", async () => {
    const { repo, transportistaRepo, update } = armar({ existente: vehiculo({ id: "v1" }) });
    await new UpdateVehiculo(repo, transportistaRepo).execute({
      id: "v1",
      empresaId: EMPRESA,
      tipo: TipoVehiculo.CAMION,
      patente: "AG469HW",
      descripcion: "Camión chasis",
    });
    expect(update).toHaveBeenCalled();
  });
});

describe("Autorizados por cliente", () => {
  function armar(opts: { cliente?: unknown; choferes?: Chofer[]; vehiculos?: Vehiculo[] } = {}) {
    const setAutorizados = vi.fn().mockResolvedValue(undefined);
    const getAutorizados = vi.fn().mockResolvedValue({ choferes: [], vehiculos: [] });
    const clienteRepo = {
      getById: vi.fn().mockResolvedValue("cliente" in opts ? opts.cliente : { id: "cli1" }),
    } as unknown as ClienteRepository;
    const choferRepo = {
      findByIds: vi.fn().mockResolvedValue(opts.choferes ?? []),
    } as unknown as ChoferRepository;
    const vehiculoRepo = {
      findByIds: vi.fn().mockResolvedValue(opts.vehiculos ?? []),
    } as unknown as VehiculoRepository;
    const repo = { setAutorizados, getAutorizados } as unknown as TransporteClienteRepository;
    return { clienteRepo, choferRepo, vehiculoRepo, repo, setAutorizados, getAutorizados };
  }

  it("falla con 404 si el cliente no es de la empresa", async () => {
    const { clienteRepo, repo } = armar({ cliente: null });
    await fallaCon(
      new GetTransporteCliente(clienteRepo, repo).execute({ clienteId: "x", empresaId: EMPRESA }),
      Code.NOT_FOUND,
    );
  });

  it("guarda las listas sin duplicados", async () => {
    const { clienteRepo, choferRepo, vehiculoRepo, repo, setAutorizados } = armar({
      choferes: [chofer({ id: "c1" })],
      vehiculos: [vehiculo({ id: "v1" }), vehiculo({ id: "v2" })],
    });
    await new SetTransporteCliente(clienteRepo, choferRepo, vehiculoRepo, repo).execute({
      clienteId: "cli1",
      empresaId: EMPRESA,
      choferIds: ["c1", "c1"],
      vehiculoIds: ["v1", "v2"],
    });
    expect(setAutorizados).toHaveBeenCalledWith("cli1", EMPRESA, ["c1"], ["v1", "v2"]);
  });

  it("no guarda nada si algún chofer o vehículo no existe en la empresa", async () => {
    const { clienteRepo, choferRepo, vehiculoRepo, repo, setAutorizados } = armar({
      choferes: [chofer({ id: "c1" })],
    });
    await fallaCon(
      new SetTransporteCliente(clienteRepo, choferRepo, vehiculoRepo, repo).execute({
        clienteId: "cli1",
        empresaId: EMPRESA,
        choferIds: ["c1", "ajeno"],
        vehiculoIds: [],
      }),
      Code.BAD_REQUEST,
    );
    expect(setAutorizados).not.toHaveBeenCalled();
  });
});
