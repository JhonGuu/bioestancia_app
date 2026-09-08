import { describe, expect, it } from "vitest";

import { calcularAjustesReversionBoleta } from "@/modules/cobros/domain/revertir-aplicaciones";
import { AplicacionCobro } from "@/modules/cobros/domain/aplicacion-cobro";

function aplicacion(overrides: Partial<AplicacionCobro> & Pick<AplicacionCobro, "id">): AplicacionCobro {
  return {
    cobroId: "cobro-1",
    boletaId: "boleta-1",
    monto: 0,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("calcularAjustesReversionBoleta — reversión LIFO", () => {
  it("no ajusta nada si lo aplicado ya cabe dentro del nuevo monto máximo", () => {
    const aplicaciones = [aplicacion({ id: "a1", monto: 500 })];

    expect(calcularAjustesReversionBoleta(aplicaciones, 500)).toEqual([]);
    expect(calcularAjustesReversionBoleta(aplicaciones, 1000)).toEqual([]);
  });

  it("revierte el exceso empezando por la aplicación MÁS RECIENTE (LIFO)", () => {
    const aplicaciones = [
      aplicacion({ id: "vieja", monto: 300, createdAt: new Date("2026-01-01") }),
      aplicacion({ id: "nueva", monto: 400, createdAt: new Date("2026-02-01") }),
    ];
    // Total aplicado: 700. Nuevo monto máximo: 500 → hay que revertir 200.
    // Tiene que salir de "nueva" primero (400 - 200 = 200), sin tocar "vieja".
    const ajustes = calcularAjustesReversionBoleta(aplicaciones, 500);

    expect(ajustes).toEqual([{ id: "nueva", nuevoMonto: 200 }]);
  });

  it("si el exceso supera la aplicación más reciente, sigue con la siguiente más reciente", () => {
    const aplicaciones = [
      aplicacion({ id: "vieja", monto: 300, createdAt: new Date("2026-01-01") }),
      aplicacion({ id: "media", monto: 200, createdAt: new Date("2026-02-01") }),
      aplicacion({ id: "nueva", monto: 400, createdAt: new Date("2026-03-01") }),
    ];
    // Total aplicado: 900. Nuevo monto máximo: 250 → hay que revertir 650.
    // "nueva" (400) se anula del todo, sigue "media" (200) se anula del
    // todo, y de "vieja" (300) solo se revierten 50 → queda en 250.
    const ajustes = calcularAjustesReversionBoleta(aplicaciones, 250);

    expect(ajustes).toEqual([
      { id: "nueva", nuevoMonto: 0 },
      { id: "media", nuevoMonto: 0 },
      { id: "vieja", nuevoMonto: 250 },
    ]);
  });

  it("revierte todo si el nuevo monto máximo es 0 (ej. la venta se borró)", () => {
    const aplicaciones = [aplicacion({ id: "a1", monto: 500 })];

    expect(calcularAjustesReversionBoleta(aplicaciones, 0)).toEqual([{ id: "a1", nuevoMonto: 0 }]);
  });

  it("no genera ajustes con una lista de aplicaciones vacía", () => {
    expect(calcularAjustesReversionBoleta([], 100)).toEqual([]);
  });
});
