import { describe, expect, it } from "vitest";

import { mapearConceptoPago } from "@/modules/cobros/infra/import/mapeo-concepto-pago.util";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

describe("mapearConceptoPago", () => {
  it("mapea los 6 conceptos de pago real (siempre negativo) a su MedioPago", () => {
    expect(mapearConceptoPago("Efectivo")).toEqual({ tipo: "cobro", medioPago: MedioPago.EFECTIVO });
    expect(mapearConceptoPago("Transferencia")).toEqual({ tipo: "cobro", medioPago: MedioPago.TRANSFERENCIA_BANCO });
    expect(mapearConceptoPago("Cheque")).toEqual({ tipo: "cobro", medioPago: MedioPago.CHEQUE });
    expect(mapearConceptoPago("Cheque electrónico")).toEqual({ tipo: "cobro", medioPago: MedioPago.ECHEQ });
    expect(mapearConceptoPago("Retenciones")).toEqual({ tipo: "cobro", medioPago: MedioPago.RETENCION });
    // "Pago" genérico → Efectivo (decisión #10).
    expect(mapearConceptoPago("Pago")).toEqual({ tipo: "cobro", medioPago: MedioPago.EFECTIVO });
  });

  it('"Compensación" admite cualquier signo — negativo es cobro, positivo es cargo OTRO (confirmado con Juan Jose)', () => {
    expect(mapearConceptoPago("Compensación")).toEqual({
      tipo: "cobro-o-cargo",
      medioPago: MedioPago.COMPENSACION,
      tipoCargoSiPositivo: TipoCargo.OTRO,
    });
  });

  it("mapea los conceptos de cargo a su TipoCargo, con el signo esperado", () => {
    expect(mapearConceptoPago("Recargo por cheque")).toEqual({
      tipo: "cargo",
      tipoCargo: TipoCargo.RECARGO_CHEQUE,
      signoEsperado: "positivo",
    });
    expect(mapearConceptoPago("Cheque Rechazado")).toEqual({
      tipo: "cargo",
      tipoCargo: TipoCargo.CHEQUE_RECHAZADO,
      signoEsperado: "positivo",
    });
    expect(mapearConceptoPago("Comisión Rechazo")).toEqual({
      tipo: "cargo",
      tipoCargo: TipoCargo.COMISION_RECHAZO,
      signoEsperado: "positivo",
    });
    expect(mapearConceptoPago("Gasoil")).toEqual({ tipo: "cargo", tipoCargo: TipoCargo.OTRO, signoEsperado: "positivo" });
    expect(mapearConceptoPago("Empleados")).toEqual({ tipo: "cargo", tipoCargo: TipoCargo.OTRO, signoEsperado: "positivo" });
  });

  it('"Ajuste por diferencia" admite cualquier signo (decisión #6)', () => {
    expect(mapearConceptoPago("Ajuste por diferencia")).toEqual({
      tipo: "cargo",
      tipoCargo: TipoCargo.OTRO,
      signoEsperado: "cualquiera",
    });
  });

  it('"Saldo inicial" se mapea a un cargo OTRO, con cualquier signo y permitiendo $0 (decisión de Juan Jose, Etapa 4)', () => {
    expect(mapearConceptoPago("Saldo inicial")).toEqual({
      tipo: "cargo",
      tipoCargo: TipoCargo.OTRO,
      signoEsperado: "cualquiera",
      permiteCero: true,
      esSaldoInicial: true,
    });
  });

  it("es tolerante a mayúsculas/tildes/espacios", () => {
    expect(mapearConceptoPago("  CHEQUE ELECTRONICO  ")).toEqual({ tipo: "cobro", medioPago: MedioPago.ECHEQ });
  });

  it("devuelve null para un concepto fuera del catálogo cerrado — no adivina", () => {
    expect(mapearConceptoPago("Descuento por pronto pago")).toBeNull();
    expect(mapearConceptoPago("")).toBeNull();
  });
});
