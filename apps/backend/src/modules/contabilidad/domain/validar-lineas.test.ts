import { describe, expect, it } from "vitest";

import { validarLineasAsiento } from "@/modules/contabilidad/domain/validar-lineas";
import { LineaAsientoInput } from "@/modules/contabilidad/domain/asiento.repository";
import { Cuenta } from "@/modules/contabilidad/domain/cuenta";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

function cuenta(overrides: Partial<Cuenta> & Pick<Cuenta, "id">): Cuenta {
  return {
    empresaId: "empresa-1",
    codigo: "1.1.01.001",
    nombre: "Caja",
    tipo: TipoCuenta.ACTIVO,
    parentId: null,
    imputable: true,
    monetaria: true,
    requiereAuxiliar: TipoAuxiliar.NINGUNO,
    activa: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function linea(overrides: Partial<LineaAsientoInput> & Pick<LineaAsientoInput, "cuentaId">): LineaAsientoInput {
  return { debe: 0, haber: 0, ...overrides };
}

describe("validarLineasAsiento — partida doble", () => {
  it("no reporta errores en un asiento balanceado, válido, de 2 líneas", () => {
    const cuentas = new Map([
      ["caja", cuenta({ id: "caja" })],
      ["ventas", cuenta({ id: "ventas", tipo: TipoCuenta.RESULTADO_POSITIVO })],
    ]);
    const lineas = [linea({ cuentaId: "caja", debe: 1000 }), linea({ cuentaId: "ventas", haber: 1000 })];

    expect(validarLineasAsiento(lineas, cuentas)).toEqual([]);
  });

  it("exige al menos dos líneas", () => {
    const cuentas = new Map([["caja", cuenta({ id: "caja" })]]);
    const errores = validarLineasAsiento([linea({ cuentaId: "caja", debe: 1000 })], cuentas);

    expect(errores).toContain("El asiento tiene que tener al menos dos líneas");
  });

  it("rechaza un asiento que no balancea, con el detalle de la diferencia", () => {
    const cuentas = new Map([
      ["caja", cuenta({ id: "caja" })],
      ["ventas", cuenta({ id: "ventas", tipo: TipoCuenta.RESULTADO_POSITIVO })],
    ]);
    const lineas = [linea({ cuentaId: "caja", debe: 1000 }), linea({ cuentaId: "ventas", haber: 850 })];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores).toContain("El asiento no balancea: debe 1000 contra haber 850 (diferencia de 150)");
  });

  it("rechaza una cuenta inexistente sin reventar (no la puede seguir validando)", () => {
    const cuentas = new Map([["caja", cuenta({ id: "caja" })]]);
    const lineas = [linea({ cuentaId: "caja", debe: 1000 }), linea({ cuentaId: "no-existe", haber: 1000 })];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores).toContain("Línea 2: la cuenta no existe o no pertenece a esta empresa");
  });

  it("rechaza imputar a una cuenta de agrupación (no imputable)", () => {
    const cuentas = new Map([
      ["caja", cuenta({ id: "caja" })],
      ["activo-corriente", cuenta({ id: "activo-corriente", imputable: false, nombre: "ACTIVO CORRIENTE" })],
    ]);
    const lineas = [
      linea({ cuentaId: "caja", debe: 1000 }),
      linea({ cuentaId: "activo-corriente", haber: 1000 }),
    ];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores.some((e) => e.includes("cuenta de agrupación"))).toBe(true);
  });

  it("rechaza imputar a una cuenta desactivada", () => {
    const cuentas = new Map([
      ["caja", cuenta({ id: "caja" })],
      ["vieja", cuenta({ id: "vieja", activa: false })],
    ]);
    const lineas = [linea({ cuentaId: "caja", debe: 1000 }), linea({ cuentaId: "vieja", haber: 1000 })];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores.some((e) => e.includes("está desactivada"))).toBe(true);
  });

  it("rechaza importes negativos", () => {
    const cuentas = new Map([
      ["caja", cuenta({ id: "caja" })],
      ["ventas", cuenta({ id: "ventas" })],
    ]);
    const lineas = [linea({ cuentaId: "caja", debe: -100 }), linea({ cuentaId: "ventas", haber: -100 })];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores.filter((e) => e.includes("no pueden ser negativos"))).toHaveLength(2);
  });

  it("rechaza una línea que imputa al debe Y al haber a la vez", () => {
    const cuentas = new Map([
      ["caja", cuenta({ id: "caja" })],
      ["ventas", cuenta({ id: "ventas" })],
    ]);
    const lineas = [
      linea({ cuentaId: "caja", debe: 500, haber: 500 }),
      linea({ cuentaId: "ventas", haber: 500 }),
    ];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores.some((e) => e.includes("no a los dos"))).toBe(true);
  });

  it("rechaza una línea sin importe (debe y haber en cero)", () => {
    const cuentas = new Map([
      ["caja", cuenta({ id: "caja" })],
      ["ventas", cuenta({ id: "ventas" })],
    ]);
    const lineas = [linea({ cuentaId: "caja", debe: 1000 }), linea({ cuentaId: "ventas" })];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores.some((e) => e.includes("no tiene importe"))).toBe(true);
  });

  it("exige auxiliar cuando la cuenta es de control (ej. deudores por ventas → cliente)", () => {
    const cuentas = new Map([
      ["deudores", cuenta({ id: "deudores", requiereAuxiliar: TipoAuxiliar.CLIENTE, nombre: "Deudores por ventas" })],
      ["ventas", cuenta({ id: "ventas" })],
    ]);
    const lineas = [linea({ cuentaId: "deudores", debe: 1000 }), linea({ cuentaId: "ventas", haber: 1000 })];

    const errores = validarLineasAsiento(lineas, cuentas);
    expect(errores.some((e) => e.includes("hay que indicar el cliente"))).toBe(true);
  });

  it("no exige auxiliar si ya viene informado", () => {
    const cuentas = new Map([
      ["deudores", cuenta({ id: "deudores", requiereAuxiliar: TipoAuxiliar.CLIENTE })],
      ["ventas", cuenta({ id: "ventas" })],
    ]);
    const lineas = [
      linea({ cuentaId: "deudores", debe: 1000, auxiliarId: "cliente-1" }),
      linea({ cuentaId: "ventas", haber: 1000 }),
    ];

    expect(validarLineasAsiento(lineas, cuentas)).toEqual([]);
  });

  it("acumula TODOS los errores encontrados, no solo el primero", () => {
    const cuentas = new Map([["caja", cuenta({ id: "caja", activa: false })]]);
    // Una sola línea: dispara "mínimo 2 líneas", "está desactivada" y "no balancea" a la vez.
    const errores = validarLineasAsiento([linea({ cuentaId: "caja", debe: 1000 })], cuentas);

    expect(errores.length).toBeGreaterThanOrEqual(3);
  });
});
