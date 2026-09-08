import { describe, expect, it } from "vitest";

import { calcularTotales, estaBalanceado, redondear2 } from "@/modules/contabilidad/domain/asiento";

describe("redondear2", () => {
  it("redondea a 2 decimales", () => {
    expect(redondear2(10.005)).toBe(10.01);
    expect(redondear2(10.004)).toBe(10);
    expect(redondear2(-5.005)).toBe(-5);
  });

  it("no introduce error de punto flotante en sumas típicas", () => {
    // 0.1 + 0.2 === 0.30000000000000004 en punto flotante sin redondear.
    expect(redondear2(0.1 + 0.2)).toBe(0.3);
  });
});

describe("calcularTotales", () => {
  it("suma debe y haber por separado y devuelve la diferencia", () => {
    const lineas = [
      { debe: 1000, haber: 0 },
      { debe: 0, haber: 600 },
      { debe: 0, haber: 400 },
    ];
    expect(calcularTotales(lineas)).toEqual({ debe: 1000, haber: 1000, diferencia: 0 });
  });

  it("reporta la diferencia cuando no balancea", () => {
    const lineas = [
      { debe: 1000, haber: 0 },
      { debe: 0, haber: 850 },
    ];
    expect(calcularTotales(lineas)).toEqual({ debe: 1000, haber: 850, diferencia: 150 });
  });

  it("devuelve ceros con una lista vacía (asiento sin líneas)", () => {
    expect(calcularTotales([])).toEqual({ debe: 0, haber: 0, diferencia: 0 });
  });

  it("no arrastra error de punto flotante en asientos con muchas líneas de centavos", () => {
    // 3 líneas de 33.33 al debe deberían dar exactamente 99.99, no 99.99000000000001.
    const lineas = [
      { debe: 33.33, haber: 0 },
      { debe: 33.33, haber: 0 },
      { debe: 33.33, haber: 0 },
      { debe: 0, haber: 99.99 },
    ];
    expect(calcularTotales(lineas)).toEqual({ debe: 99.99, haber: 99.99, diferencia: 0 });
  });
});

describe("estaBalanceado", () => {
  it("es true cuando debe === haber", () => {
    expect(
      estaBalanceado([
        { debe: 500, haber: 0 },
        { debe: 0, haber: 500 },
      ]),
    ).toBe(true);
  });

  it("es false ante cualquier diferencia, por mínima que sea", () => {
    expect(
      estaBalanceado([
        { debe: 500, haber: 0 },
        { debe: 0, haber: 499.99 },
      ]),
    ).toBe(false);
  });
});
