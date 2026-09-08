import { describe, expect, it, vi } from "vitest";

import { AplicarCobroFifo } from "@/modules/cobros/use-cases/aplicar-cobro-fifo.use-case";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { Boleta } from "@/modules/boletas/domain/boleta";
import { Venta } from "@/modules/ventas/domain/venta";
import { AplicacionCobro } from "@/modules/cobros/domain/aplicacion-cobro";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

const EMPRESA_ID = "empresa-1";
const CLIENTE_ID = "cliente-1";

function boleta(overrides: Partial<Boleta> & Pick<Boleta, "id" | "fecha">): Boleta {
  return {
    empresaId: EMPRESA_ID,
    clienteId: CLIENTE_ID,
    fechaVencimiento: null,
    numero: null,
    comentarios: null,
    activo: true,
    createdAt: overrides.fecha,
    updatedAt: overrides.fecha,
    ...overrides,
  };
}

function venta(overrides: Partial<Venta> & Pick<Venta, "boletaId" | "total">): Venta {
  return {
    id: `venta-${Math.random()}`,
    empresaId: EMPRESA_ID,
    clienteId: CLIENTE_ID,
    compraId: null,
    garron: null,
    formaVenta: FormaVenta.MEDIA_RES,
    categoria: null,
    kg: 100,
    precioKg: 500,
    fecha: new Date("2026-01-01"),
    clienteFinalId: null,
    comentarios: null,
    activo: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function aplicacion(overrides: Partial<AplicacionCobro> & Pick<AplicacionCobro, "boletaId" | "monto">): AplicacionCobro {
  return {
    id: `aplicacion-${Math.random()}`,
    cobroId: "cobro-previo",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

/** Arma el caso de uso con repos mockeados a partir de boletas/ventas/aplicaciones previas ya dadas. */
function construirCaso(boletas: Boleta[], ventas: Venta[], aplicacionesPrevias: AplicacionCobro[] = []) {
  const boletaRepository: Pick<BoletaRepository, "listByCliente"> = {
    listByCliente: vi.fn().mockResolvedValue(boletas),
  };
  const ventaRepository: Pick<VentaRepository, "listByCliente"> = {
    listByCliente: vi.fn().mockResolvedValue(ventas),
  };
  const cobroRepository: Pick<CobroRepository, "listAplicacionesByCliente"> = {
    listAplicacionesByCliente: vi.fn().mockResolvedValue(aplicacionesPrevias),
  };

  return new AplicarCobroFifo(
    boletaRepository as BoletaRepository,
    ventaRepository as VentaRepository,
    cobroRepository as CobroRepository,
  );
}

describe("AplicarCobroFifo — algoritmo FIFO de aplicación de cobros", () => {
  it("aplica el cobro completo a la única boleta pendiente cuando alcanza exacto", async () => {
    const b1 = boleta({ id: "b1", fecha: new Date("2026-01-01") });
    const fifo = construirCaso([b1], [venta({ boletaId: "b1", total: 1000 })]);

    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 1000 });

    expect(resultado).toEqual([{ boletaId: "b1", monto: 1000 }]);
  });

  it("aplica primero a la boleta MÁS VIEJA (FIFO por fecha), no por orden de llegada", async () => {
    const nueva = boleta({ id: "nueva", fecha: new Date("2026-03-01") });
    const vieja = boleta({ id: "vieja", fecha: new Date("2026-01-01") });
    // Ojo: se pasan en orden "nueva, vieja" a propósito, para probar que el
    // algoritmo ordena por fecha y no confía en el orden del repositorio.
    const fifo = construirCaso(
      [nueva, vieja],
      [venta({ boletaId: "nueva", total: 500 }), venta({ boletaId: "vieja", total: 500 })],
    );

    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 500 });

    expect(resultado).toEqual([{ boletaId: "vieja", monto: 500 }]);
  });

  it("distribuye un cobro entre varias boletas pendientes, más vieja primero, hasta agotarlo", async () => {
    const b1 = boleta({ id: "b1", fecha: new Date("2026-01-01") });
    const b2 = boleta({ id: "b2", fecha: new Date("2026-02-01") });
    const b3 = boleta({ id: "b3", fecha: new Date("2026-03-01") });
    const fifo = construirCaso(
      [b3, b1, b2],
      [
        venta({ boletaId: "b1", total: 1000 }),
        venta({ boletaId: "b2", total: 1000 }),
        venta({ boletaId: "b3", total: 1000 }),
      ],
    );

    // Alcanza para cancelar b1 y b2 enteras, y dejar b3 a mitad de pago.
    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 2500 });

    expect(resultado).toEqual([
      { boletaId: "b1", monto: 1000 },
      { boletaId: "b2", monto: 1000 },
      { boletaId: "b3", monto: 500 },
    ]);
  });

  it("si el cobro sobra, el excedente no se aplica a nada (no fuerza saldo negativo en ninguna boleta)", async () => {
    const b1 = boleta({ id: "b1", fecha: new Date("2026-01-01") });
    const fifo = construirCaso([b1], [venta({ boletaId: "b1", total: 1000 })]);

    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 1500 });

    // Solo 1000 se aplica a b1 — el resto (500) queda afuera de esta lista;
    // el caller es quien lo deja como "saldo a favor", este método no debe
    // inventar una aplicación por más de lo que la boleta realmente debe.
    expect(resultado).toEqual([{ boletaId: "b1", monto: 1000 }]);
  });

  it("ignora boletas ya canceladas por aplicaciones previas", async () => {
    const b1 = boleta({ id: "b1", fecha: new Date("2026-01-01") });
    const b2 = boleta({ id: "b2", fecha: new Date("2026-02-01") });
    const fifo = construirCaso(
      [b1, b2],
      [venta({ boletaId: "b1", total: 1000 }), venta({ boletaId: "b2", total: 1000 })],
      [aplicacion({ boletaId: "b1", monto: 1000 })], // b1 ya está saldada.
    );

    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 1000 });

    expect(resultado).toEqual([{ boletaId: "b2", monto: 1000 }]);
  });

  it("aplica solo el saldo pendiente de una boleta parcialmente pagada, no su monto total", async () => {
    const b1 = boleta({ id: "b1", fecha: new Date("2026-01-01") });
    const fifo = construirCaso(
      [b1],
      [venta({ boletaId: "b1", total: 1000 })],
      [aplicacion({ boletaId: "b1", monto: 300 })], // ya se pagaron 300 de 1000.
    );

    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 700 });

    expect(resultado).toEqual([{ boletaId: "b1", monto: 700 }]);
  });

  it("una boleta con alguna venta pendiente de precio NO participa del FIFO todavía", async () => {
    const b1 = boleta({ id: "b1", fecha: new Date("2026-01-01") }); // pendiente de precio
    const b2 = boleta({ id: "b2", fecha: new Date("2026-02-01") }); // sí facturada
    const fifo = construirCaso(
      [b1, b2],
      [
        venta({ boletaId: "b1", total: null, precioKg: null }),
        venta({ boletaId: "b2", total: 1000 }),
      ],
    );

    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 1000 });

    // A pesar de que b1 es cronológicamente más vieja, no puede recibir un
    // pago porque todavía no se sabe cuánto vale — el cobro tiene que
    // saltearla e ir a la boleta que sí tiene monto conocido.
    expect(resultado).toEqual([{ boletaId: "b2", monto: 1000 }]);
  });

  it("no aplica nada si no hay boletas pendientes (todo al día)", async () => {
    const fifo = construirCaso([], []);

    const resultado = await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 500 });

    expect(resultado).toEqual([]);
  });

  it("no aplica nada si el monto disponible es cero o negativo", async () => {
    const b1 = boleta({ id: "b1", fecha: new Date("2026-01-01") });
    const fifo = construirCaso([b1], [venta({ boletaId: "b1", total: 1000 })]);

    expect(await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: 0 })).toEqual([]);
    expect(await fifo.execute({ clienteId: CLIENTE_ID, empresaId: EMPRESA_ID, montoDisponible: -100 })).toEqual([]);
  });
});
