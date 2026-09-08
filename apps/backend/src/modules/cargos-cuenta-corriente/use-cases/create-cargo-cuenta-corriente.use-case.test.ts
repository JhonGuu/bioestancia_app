import { describe, expect, it, vi } from "vitest";

import { CreateCargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/use-cases/create-cargo-cuenta-corriente.use-case";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { CargoCuentaCorriente } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { GenerarAsientosAutomaticos } from "@/modules/contabilidad/use-cases/generar-asientos-automaticos.use-case";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";
import { Logger } from "@/shared/infra/logger/logger";
import { ApiError } from "@/shared/infra/http/api.responses";

const EMPRESA_ID = "empresa-1";
const CLIENTE_ID = "cliente-1";

function cliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: CLIENTE_ID,
    empresaId: EMPRESA_ID,
    listaDePreciosId: null,
    nombre: "Juan",
    apellido: "Pérez",
    razonSocial: null,
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

function cargoPersistido(overrides: Partial<CargoCuentaCorriente> = {}): CargoCuentaCorriente {
  return {
    id: "cargo-1",
    empresaId: EMPRESA_ID,
    clienteId: CLIENTE_ID,
    tipo: TipoCargo.OTRO,
    monto: 500,
    chequeId: null,
    motivo: null,
    fecha: new Date("2026-01-10"),
    activo: true,
    createdAt: new Date("2026-01-10"),
    updatedAt: new Date("2026-01-10"),
    ...overrides,
  };
}

/**
 * Arma el use-case con repos/servicios mockeados — mismo patrón que
 * `generar-asientos-automaticos.use-case.test.ts`: `Pick<Interface,
 * "método">` + `vi.fn()`, solo con los métodos que este use-case realmente usa.
 */
function construirCaso(opciones: { cargoAGuardar?: Partial<CargoCuentaCorriente>; clienteExiste?: boolean } = {}) {
  const cargoGuardado = cargoPersistido(opciones.cargoAGuardar);

  const clienteRepository: Pick<ClienteRepository, "getById"> = {
    getById: vi.fn().mockResolvedValue(opciones.clienteExiste === false ? null : cliente()),
  };

  const cargoCuentaCorrienteRepository: Pick<CargoCuentaCorrienteRepository, "create"> = {
    create: vi.fn().mockResolvedValue(cargoGuardado),
  };

  const generarAsientosAutomaticos: Pick<GenerarAsientosAutomaticos, "execute"> = {
    execute: vi.fn().mockResolvedValue({ generado: true }),
  };

  const logger: Pick<Logger, "warn"> = { warn: vi.fn() };

  const useCase = new CreateCargoCuentaCorriente(
    clienteRepository as ClienteRepository,
    cargoCuentaCorrienteRepository as CargoCuentaCorrienteRepository,
    generarAsientosAutomaticos as GenerarAsientosAutomaticos,
    logger as Logger,
  );

  return { useCase, clienteRepository, cargoCuentaCorrienteRepository, generarAsientosAutomaticos, logger, cargoGuardado };
}

describe("CreateCargoCuentaCorriente", () => {
  it("crea un cargo con monto positivo y dispara el asiento automático de CARGO_OTRO", async () => {
    const { useCase, cargoCuentaCorrienteRepository, generarAsientosAutomaticos } = construirCaso({
      cargoAGuardar: { monto: 500, tipo: TipoCargo.OTRO },
    });

    const resultado = await useCase.execute({
      empresaId: EMPRESA_ID,
      clienteId: CLIENTE_ID,
      tipo: TipoCargo.OTRO,
      monto: 500,
      fecha: new Date("2026-01-10"),
    });

    expect(resultado.monto).toBe(500);
    expect(cargoCuentaCorrienteRepository.create).toHaveBeenCalledWith(expect.objectContaining({ monto: 500 }));
    expect(generarAsientosAutomaticos.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        evento: EventoAsiento.CARGO_OTRO,
        unidades: [{ monto: 500, clienteId: CLIENTE_ID }],
      }),
    );
  });

  it("acepta un monto negativo (ej. un ajuste por diferencia que reduce la deuda del cliente)", async () => {
    const { useCase, cargoCuentaCorrienteRepository, generarAsientosAutomaticos } = construirCaso({
      cargoAGuardar: { monto: -300, tipo: TipoCargo.OTRO },
    });

    const resultado = await useCase.execute({
      empresaId: EMPRESA_ID,
      clienteId: CLIENTE_ID,
      tipo: TipoCargo.OTRO,
      monto: -300,
      fecha: new Date("2026-01-10"),
    });

    expect(resultado.monto).toBe(-300);
    expect(cargoCuentaCorrienteRepository.create).toHaveBeenCalledWith(expect.objectContaining({ monto: -300 }));
    // El monto negativo se pasa tal cual a GenerarAsientosAutomaticos — es
    // `evaluarReglaAsiento` quien decide invertir el lado debe/haber.
    expect(generarAsientosAutomaticos.execute).toHaveBeenCalledWith(
      expect.objectContaining({ unidades: [{ monto: -300, clienteId: CLIENTE_ID }] }),
    );
  });

  it("rechaza un monto igual a cero", async () => {
    const { useCase, cargoCuentaCorrienteRepository } = construirCaso();

    await expect(
      useCase.execute({ empresaId: EMPRESA_ID, clienteId: CLIENTE_ID, tipo: TipoCargo.OTRO, monto: 0, fecha: new Date("2026-01-10") }),
    ).rejects.toThrow(ApiError);
    expect(cargoCuentaCorrienteRepository.create).not.toHaveBeenCalled();
  });

  it("rechaza si el cliente no existe (o no es de esta empresa)", async () => {
    const { useCase, cargoCuentaCorrienteRepository } = construirCaso({ clienteExiste: false });

    await expect(
      useCase.execute({ empresaId: EMPRESA_ID, clienteId: CLIENTE_ID, tipo: TipoCargo.OTRO, monto: 500, fecha: new Date("2026-01-10") }),
    ).rejects.toThrow(ApiError);
    expect(cargoCuentaCorrienteRepository.create).not.toHaveBeenCalled();
  });

  it("no dispara el asiento automático para tipos distintos de OTRO (ej. RECARGO_CHEQUE, creado desde otro flujo)", async () => {
    const { useCase, generarAsientosAutomaticos } = construirCaso({
      cargoAGuardar: { tipo: TipoCargo.RECARGO_CHEQUE, monto: 50 },
    });

    await useCase.execute({
      empresaId: EMPRESA_ID,
      clienteId: CLIENTE_ID,
      tipo: TipoCargo.RECARGO_CHEQUE,
      monto: 50,
      fecha: new Date("2026-01-10"),
    });

    expect(generarAsientosAutomaticos.execute).not.toHaveBeenCalled();
  });

  it("registra un warning (no rechaza) si GenerarAsientosAutomaticos devuelve una advertencia", async () => {
    const { useCase, generarAsientosAutomaticos, logger } = construirCaso({ cargoAGuardar: { tipo: TipoCargo.OTRO } });
    (generarAsientosAutomaticos.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      generado: false,
      advertencia: "no se encontró una regla activa",
    });

    const resultado = await useCase.execute({
      empresaId: EMPRESA_ID,
      clienteId: CLIENTE_ID,
      tipo: TipoCargo.OTRO,
      monto: 500,
      fecha: new Date("2026-01-10"),
    });

    expect(resultado).toBeDefined();
    expect(logger.warn).toHaveBeenCalledWith("no se encontró una regla activa");
  });
});
