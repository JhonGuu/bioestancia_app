import { describe, expect, it } from "vitest";

import {
  esCuitValido,
  esPatenteValida,
  normalizarCuit,
  normalizarPatente,
} from "@/modules/transportes/domain/documento-transporte";

describe("CUIT", () => {
  it("acepta CUITs reales de empresas y de personas", () => {
    expect(esCuitValido("30716873974")).toBe(true);
    expect(esCuitValido("30718593499")).toBe(true);
    expect(esCuitValido("20423341379")).toBe(true);
  });

  it("acepta guiones y espacios y los normaliza", () => {
    expect(esCuitValido("30-71687397-4")).toBe(true);
    expect(normalizarCuit(" 30-71687397-4 ")).toBe("30716873974");
  });

  it("rechaza un dígito verificador incorrecto", () => {
    expect(esCuitValido("30716873975")).toBe(false);
    expect(esCuitValido("20423341370")).toBe(false);
  });

  it("rechaza largos incorrectos y caracteres que no son dígitos", () => {
    expect(esCuitValido("3071687397")).toBe(false);
    expect(esCuitValido("307168739744")).toBe(false);
    expect(esCuitValido("")).toBe(false);
    expect(esCuitValido("abcdefghijk")).toBe(false);
  });
});

describe("Patente", () => {
  it("normaliza a mayúsculas sin espacios ni guiones", () => {
    expect(normalizarPatente("ag 469-hw")).toBe("AG469HW");
    expect(normalizarPatente(" abc123 ")).toBe("ABC123");
  });

  it("acepta el formato viejo (ABC123) y el Mercosur (AB123CD)", () => {
    expect(esPatenteValida("ABC123")).toBe(true);
    expect(esPatenteValida("AG469HW")).toBe(true);
    expect(esPatenteValida("ag-469-hw")).toBe(true);
  });

  it("rechaza formatos que no son patentes", () => {
    expect(esPatenteValida("AB1234")).toBe(false);
    expect(esPatenteValida("ABCD12")).toBe(false);
    expect(esPatenteValida("AG469H")).toBe(false);
    expect(esPatenteValida("")).toBe(false);
  });
});
