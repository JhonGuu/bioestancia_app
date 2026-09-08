import { describe, expect, it } from "vitest";

import { evaluarReglaAsiento, reglaAplicaAUnidad } from "@/modules/contabilidad/domain/evaluar-regla-asiento";
import { EventoAsiento, ReglaAsiento, ReglaAsientoLinea } from "@/modules/contabilidad/domain/regla-asiento";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { UnidadEventoContable } from "@/modules/contabilidad/domain/eventos-contables";

function lineaRegla(overrides: Partial<ReglaAsientoLinea> & Pick<ReglaAsientoLinea, "orden" | "lado" | "expresion">): ReglaAsientoLinea {
  return {
    id: `linea-${Math.random()}`,
    reglaId: "regla-1",
    cuentaId: "cuenta-1",
    auxiliarResolver: null,
    ...overrides,
  };
}

function regla(overrides: Partial<ReglaAsiento> & Pick<ReglaAsiento, "lineas">): ReglaAsiento {
  return {
    id: "regla-1",
    empresaId: "empresa-1",
    evento: EventoAsiento.COBRO_REGISTRADO,
    nombre: "Regla de prueba",
    activa: true,
    prioridad: 1,
    condicion: null,
    ...overrides,
  };
}

describe("reglaAplicaAUnidad", () => {
  it("no aplica si la regla está inactiva, aunque no tenga condición", () => {
    const r = regla({ activa: false, lineas: [] });
    expect(reglaAplicaAUnidad(r, {})).toBe(false);
  });

  it("aplica siempre que esté activa si no tiene condición", () => {
    const r = regla({ condicion: null, lineas: [] });
    expect(reglaAplicaAUnidad(r, { medioPago: "efectivo" })).toBe(true);
  });

  it("aplica solo si TODAS las claves de la condición matchean (comparación exacta de texto)", () => {
    const r = regla({ condicion: { medioPago: "efectivo" }, lineas: [] });
    expect(reglaAplicaAUnidad(r, { medioPago: "efectivo" })).toBe(true);
    expect(reglaAplicaAUnidad(r, { medioPago: "cheque" })).toBe(false);
  });

  it("con varias claves en la condición, alcanza con que UNA no matchee para que no aplique", () => {
    const r = regla({ condicion: { medioPago: "efectivo", clienteId: "cliente-1" }, lineas: [] });
    expect(reglaAplicaAUnidad(r, { medioPago: "efectivo", clienteId: "cliente-1" })).toBe(true);
    expect(reglaAplicaAUnidad(r, { medioPago: "efectivo", clienteId: "cliente-2" })).toBe(false);
  });

  it("una clave de la condición ausente en la unidad se compara contra string vacío, no matchea", () => {
    const r = regla({ condicion: { medioPago: "efectivo" }, lineas: [] });
    // La unidad ni siquiera trae `medioPago` (undefined) — no puede matchear "efectivo".
    expect(reglaAplicaAUnidad(r, { clienteId: "cliente-1" })).toBe(false);
  });
});

describe("evaluarReglaAsiento", () => {
  it("genera una línea al debe por cada línea de la regla con expresión numérica distinta de cero", () => {
    const r = regla({
      lineas: [lineaRegla({ orden: 1, lado: "debe", expresion: "monto", cuentaId: "caja" })],
    });
    const unidad: UnidadEventoContable = { monto: 1500 };

    expect(evaluarReglaAsiento(r, unidad)).toEqual([
      { cuentaId: "caja", debe: 1500, haber: 0, auxiliarTipo: null, auxiliarId: null },
    ]);
  });

  it("genera una línea al haber igual que al debe, según el lado configurado", () => {
    const r = regla({
      lineas: [lineaRegla({ orden: 1, lado: "haber", expresion: "monto", cuentaId: "ingresos" })],
    });

    expect(evaluarReglaAsiento(r, { monto: 1500 })).toEqual([
      { cuentaId: "ingresos", debe: 0, haber: 1500, auxiliarTipo: null, auxiliarId: null },
    ]);
  });

  it("usa siempre el valor absoluto del monto (el signo lo da debe/haber, no un número negativo)", () => {
    const r = regla({
      lineas: [lineaRegla({ orden: 1, lado: "debe", expresion: "monto", cuentaId: "caja" })],
    });

    expect(evaluarReglaAsiento(r, { monto: -500 })).toEqual([
      { cuentaId: "caja", debe: 500, haber: 0, auxiliarTipo: null, auxiliarId: null },
    ]);
  });

  it("redondea el monto a 2 decimales", () => {
    const r = regla({
      lineas: [lineaRegla({ orden: 1, lado: "debe", expresion: "monto", cuentaId: "caja" })],
    });

    expect(evaluarReglaAsiento(r, { monto: 100.005 })[0]?.debe).toBe(100.01);
  });

  it("omite una línea cuya expresión no está en la unidad o vale cero", () => {
    const r = regla({
      lineas: [
        lineaRegla({ orden: 1, lado: "debe", expresion: "monto", cuentaId: "caja" }),
        lineaRegla({ orden: 2, lado: "debe", expresion: "totalGastos", cuentaId: "gastos" }),
      ],
    });

    // `totalGastos` no viene en la unidad (undefined) y `monto` es 0 — las dos se omiten.
    expect(evaluarReglaAsiento(r, { monto: 0 })).toEqual([]);
  });

  it("resuelve el auxiliar desde `<resolver>Id` de la unidad cuando la línea lo pide", () => {
    const r = regla({
      lineas: [lineaRegla({ orden: 1, lado: "haber", expresion: "monto", cuentaId: "deudores", auxiliarResolver: "cliente" })],
    });

    expect(evaluarReglaAsiento(r, { monto: 1000, clienteId: "cliente-1" })).toEqual([
      { cuentaId: "deudores", debe: 0, haber: 1000, auxiliarTipo: TipoAuxiliar.CLIENTE, auxiliarId: "cliente-1" },
    ]);
  });

  it("omite la línea si pide auxiliar y la unidad no lo trae — no rompe el resto del asiento", () => {
    const r = regla({
      lineas: [
        lineaRegla({ orden: 1, lado: "debe", expresion: "monto", cuentaId: "caja" }),
        lineaRegla({ orden: 2, lado: "haber", expresion: "monto", cuentaId: "deudores", auxiliarResolver: "cliente" }),
      ],
    });

    // Sin `clienteId` en la unidad, solo se genera la primera línea.
    expect(evaluarReglaAsiento(r, { monto: 1000 })).toEqual([
      { cuentaId: "caja", debe: 1000, haber: 0, auxiliarTipo: null, auxiliarId: null },
    ]);
  });

  it("evalúa las líneas en orden de `orden`, sin importar el orden en que vienen en el array", () => {
    const r = regla({
      lineas: [
        lineaRegla({ orden: 2, lado: "haber", expresion: "importeIva", cuentaId: "iva" }),
        lineaRegla({ orden: 1, lado: "debe", expresion: "importeBruto", cuentaId: "caja" }),
      ],
    });

    const resultado = evaluarReglaAsiento(r, { importeBruto: 1000, importeIva: 210 });

    expect(resultado.map((l) => l.cuentaId)).toEqual(["caja", "iva"]);
  });

  it("una regla con varias líneas puede generar un asiento balanceado (debe === haber)", () => {
    const r = regla({
      lineas: [
        lineaRegla({ orden: 1, lado: "debe", expresion: "monto", cuentaId: "caja" }),
        lineaRegla({ orden: 2, lado: "haber", expresion: "monto", cuentaId: "deudores", auxiliarResolver: "cliente" }),
      ],
    });

    const lineas = evaluarReglaAsiento(r, { monto: 1500, clienteId: "cliente-1" });
    const totalDebe = lineas.reduce((acc, l) => acc + l.debe, 0);
    const totalHaber = lineas.reduce((acc, l) => acc + l.haber, 0);

    expect(totalDebe).toBe(totalHaber);
  });
});
