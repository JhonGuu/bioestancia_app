import { describe, expect, it } from "vitest";

import { calcularMontoBoleta } from "@/modules/boletas/domain/calcular-monto-boleta";
import { Venta } from "@/modules/ventas/domain/venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

function venta(overrides: Partial<Venta> = {}): Venta {
  return {
    id: "venta-1",
    empresaId: "empresa-1",
    clienteId: "cliente-1",
    boletaId: "boleta-1",
    compraId: null,
    garron: null,
    formaVenta: FormaVenta.MEDIA_RES,
    categoria: null,
    kg: 100,
    precioKg: 500,
    total: 50000,
    fecha: new Date("2026-01-01"),
    clienteFinalId: null,
    comentarios: null,
    activo: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("calcularMontoBoleta", () => {
  it("suma el total de todas las ventas cuando todas tienen precio cargado", () => {
    const ventas = [venta({ total: 50000 }), venta({ id: "venta-2", total: 30000 })];

    expect(calcularMontoBoleta(ventas)).toEqual({ facturada: true, monto: 80000 });
  });

  it("una boleta sin ventas no está facturada y su monto es 0", () => {
    expect(calcularMontoBoleta([])).toEqual({ facturada: false, monto: 0 });
  });

  it("si UNA SOLA venta está pendiente de precio, la boleta entera no participa del saldo todavía", () => {
    const ventas = [
      venta({ total: 50000, precioKg: 500 }),
      venta({ id: "venta-2", total: null, precioKg: null }),
    ];

    // Aunque una de las dos ventas sí tiene precio, el monto de la boleta es
    // 0 hasta que TODAS estén facturadas — no se puede cobrar "a medias".
    expect(calcularMontoBoleta(ventas)).toEqual({ facturada: false, monto: 0 });
  });

  it("una compensación de kg (total negativo) resta del monto de la boleta", () => {
    const ventas = [
      venta({ total: 50000 }),
      venta({ id: "compensacion", formaVenta: FormaVenta.COMPENSACION_KG, kg: -5, total: -2500 }),
    ];

    expect(calcularMontoBoleta(ventas)).toEqual({ facturada: true, monto: 47500 });
  });
});
