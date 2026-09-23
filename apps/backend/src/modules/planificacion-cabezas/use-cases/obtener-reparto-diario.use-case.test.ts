import { describe, expect, it, vi } from "vitest";

import { ObtenerRepartoDiario } from "@/modules/planificacion-cabezas/use-cases/obtener-reparto-diario.use-case";
import {
  ListPlanificacionCabezas,
  PlanificacionCabezasConVentas,
} from "@/modules/planificacion-cabezas/use-cases/list-planificacion-cabezas.use-case";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { Empresa } from "@/modules/empresas/domain/empresa";
import { ApiError } from "@/shared/infra/http/api.responses";

const EMPRESA_ID = "empresa-1";
const FECHA = new Date("2026-09-24T00:00:00.000Z");

function cliente(id: string, overrides: Partial<Cliente> = {}): Cliente {
  return {
    id,
    empresaId: EMPRESA_ID,
    listaDePreciosId: null,
    nombre: id,
    apellido: "Test",
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

function fila(
  clienteId: string,
  dia: string,
  overrides: Partial<PlanificacionCabezasConVentas> = {},
): PlanificacionCabezasConVentas {
  return {
    id: `${clienteId}-${dia}`,
    empresaId: EMPRESA_ID,
    clienteId,
    fecha: new Date(`${dia}T00:00:00.000Z`),
    cabezasPlanificadas: 0,
    cabezasVendidas: 0,
    comentarios: null,
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function armar(clientes: Cliente[], filas: PlanificacionCabezasConVentas[], empresa: Empresa | null = { id: EMPRESA_ID, razonSocial: "El Meridiano" } as Empresa) {
  const empresaRepository = { getById: vi.fn().mockResolvedValue(empresa) } as unknown as EmpresaRepository;
  const clienteRepository = { list: vi.fn().mockResolvedValue(clientes) } as unknown as ClienteRepository;
  const list = { execute: vi.fn().mockResolvedValue(filas) } as unknown as ListPlanificacionCabezas;
  return { useCase: new ObtenerRepartoDiario(empresaRepository, clienteRepository, list), list };
}

describe("ObtenerRepartoDiario", () => {
  it("lista solo los clientes con cabezas ese día, ordenados y con su aclaración, y suma el total", () => {
    const { useCase } = armar(
      [cliente("zeta"), cliente("alfa"), cliente("beta")],
      [
        fila("zeta", "2026-09-24", { cabezasPlanificadas: 3, comentarios: "  sin confirmar " }),
        fila("alfa", "2026-09-24", { cabezasPlanificadas: 10 }),
        fila("beta", "2026-09-24", { cabezasPlanificadas: 0 }),
      ],
    );

    return useCase.execute({ empresaId: EMPRESA_ID, fecha: FECHA }).then((reparto) => {
      expect(reparto.fecha).toBe("2026-09-24");
      expect(reparto.empresa.razonSocial).toBe("El Meridiano");
      expect(reparto.lineas.map((l) => [l.cliente, l.cabezas, l.comentarios])).toEqual([
        ["alfa Test", 10, null],
        ["zeta Test", 3, "sin confirmar"],
      ]);
      expect(reparto.totalCabezas).toBe(13);
    });
  });

  it("marca como NO LLEVAN a los habituales (últimas 4 semanas) que hoy tienen 0, solo si están activos", async () => {
    const { useCase } = armar(
      [
        cliente("ramirez"),
        cliente("moyano"),
        cliente("inactivo", { activo: false }),
        cliente("nuncaLlevo"),
        cliente("lleva"),
      ],
      [
        fila("ramirez", "2026-09-17", { cabezasPlanificadas: 5 }),
        fila("moyano", "2026-09-10", { cabezasPlanificadas: 0, cabezasVendidas: 4 }),
        fila("inactivo", "2026-09-17", { cabezasPlanificadas: 5 }),
        fila("lleva", "2026-09-17", { cabezasPlanificadas: 5 }),
        fila("lleva", "2026-09-24", { cabezasPlanificadas: 6 }),
      ],
    );

    const reparto = await useCase.execute({ empresaId: EMPRESA_ID, fecha: FECHA });

    expect(reparto.noLlevan).toEqual(["moyano Test", "ramirez Test"]);
    expect(reparto.lineas.map((l) => l.cliente)).toEqual(["lleva Test"]);
  });

  it("consulta el plan desde 28 días antes hasta el día del reparto", async () => {
    const { useCase, list } = armar([], []);

    await useCase.execute({ empresaId: EMPRESA_ID, fecha: FECHA });

    expect(list.execute).toHaveBeenCalledWith({
      empresaId: EMPRESA_ID,
      desde: new Date("2026-08-27T00:00:00.000Z"),
      hasta: FECHA,
    });
  });

  it("devuelve un reparto vacío si nadie lleva cabezas ese día", async () => {
    const { useCase } = armar([cliente("a")], []);

    const reparto = await useCase.execute({ empresaId: EMPRESA_ID, fecha: FECHA });

    expect(reparto.lineas).toEqual([]);
    expect(reparto.totalCabezas).toBe(0);
    expect(reparto.noLlevan).toEqual([]);
  });

  it("falla con NOT_FOUND si la empresa no existe", async () => {
    const { useCase } = armar([], [], null);

    await expect(useCase.execute({ empresaId: EMPRESA_ID, fecha: FECHA })).rejects.toBeInstanceOf(ApiError);
  });
});
