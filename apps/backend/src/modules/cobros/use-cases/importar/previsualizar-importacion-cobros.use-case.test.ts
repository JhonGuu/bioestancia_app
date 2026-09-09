import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

import { PrevisualizarImportacionCobros } from "@/modules/cobros/use-cases/importar/previsualizar-importacion-cobros.use-case";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";

const ENCABEZADO_REAL = [
  null,
  "SEM",
  "Fecha",
  "Forma de venta",
  "Cantidad",
  "Kg",
  "Concepto",
  "Importe",
  "Tipo",
  "Observaciones",
  "Saldo",
];

function filaCliente(fila: (string | number | Date | null)[]): (string | number | Date | null)[] {
  return [null, ...fila];
}

function construirWorkbook(hojas: Record<string, (string | number | Date | null)[][]>): Buffer {
  const wb = XLSX.utils.book_new();
  for (const [nombre, filas] of Object.entries(hojas)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(filas), nombre);
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function cliente(overrides: Partial<Cliente>): Cliente {
  return {
    id: "cliente-existente-1",
    empresaId: "empresa-1",
    listaDePreciosId: null,
    nombre: null,
    apellido: null,
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

function construirCaso(clientesExistentes: Cliente[] = []) {
  const clienteRepository: Pick<ClienteRepository, "list"> = {
    list: vi.fn().mockResolvedValue(clientesExistentes),
  };
  const useCase = new PrevisualizarImportacionCobros(clienteRepository as ClienteRepository);
  return { useCase, clienteRepository };
}

describe("PrevisualizarImportacionCobros", () => {
  it("separa las filas Tipo: Pago en cobros y cargos según el Concepto", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Efectivo", -50000, "Pago"]),
        filaCliente([2, new Date(Date.UTC(2026, 0, 6)), null, null, null, "Gasoil", 5000, "Pago"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.totalFilasPago).toBe(2);
    expect(preview.cobrosACrear).toHaveLength(1);
    expect(preview.cobrosACrear[0]).toMatchObject({ medioPago: MedioPago.EFECTIVO, monto: 50000, fecha: "2026-01-05" });
    expect(preview.cargosACrear).toHaveLength(1);
    expect(preview.cargosACrear[0]).toMatchObject({ tipo: TipoCargo.OTRO, monto: 5000, fecha: "2026-01-06" });
    expect(preview.conError).toHaveLength(0);
  });

  it('"Pago" genérico entra como Efectivo (decisión #10)', async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [ENCABEZADO_REAL, filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Pago", -1000, "Pago"])],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cobrosACrear[0]?.medioPago).toBe(MedioPago.EFECTIVO);
  });

  it('"Saldo inicial" se carga como un cargo OTRO fechado 2025-12-28, marcado esSaldoInicial (decisión de Juan Jose, Etapa 4)', async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2025, 11, 28)), null, null, null, "Saldo inicial", 2970150.32, "Pago"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.saldosInicialesEnCero).toBe(0);
    expect(preview.cobrosACrear).toHaveLength(0);
    expect(preview.cargosACrear).toHaveLength(1);
    expect(preview.cargosACrear[0]).toMatchObject({
      tipo: TipoCargo.OTRO,
      monto: 2970150.32,
      fecha: "2025-12-28",
      esSaldoInicial: true,
    });
    expect(preview.conError).toHaveLength(0);
  });

  it('"Saldo inicial" en $0 no genera cargo (un CargoCuentaCorriente nunca puede valer cero) — se cuenta aparte, no es error', async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2025, 11, 28)), null, null, null, "Saldo inicial", 0, "Pago"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.saldosInicialesEnCero).toBe(1);
    expect(preview.cargosACrear).toHaveLength(0);
    expect(preview.conError).toHaveLength(0);
  });

  it('un cargo con signo fijo (ej. Gasoil) en $0 SÍ es error — "permiteCero" es exclusivo de Saldo inicial', async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [ENCABEZADO_REAL, filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Gasoil", 0, "Pago"])],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cargosACrear).toHaveLength(0);
    expect(preview.conError[0]?.errores[0]).toMatch(/no puede ser cero/);
  });

  it("reporta como error un Concepto fuera del catálogo cerrado, sin adivinar", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [ENCABEZADO_REAL, filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Descuento raro", -1000, "Pago"])],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cobrosACrear).toHaveLength(0);
    expect(preview.conError).toHaveLength(1);
    expect(preview.conError[0]?.errores[0]).toMatch(/concepto no reconocido/);
  });

  it("exige importe negativo para conceptos de cobro — no lo adivina si viene positivo", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [ENCABEZADO_REAL, filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Efectivo", 1000, "Pago"])],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cobrosACrear).toHaveLength(0);
    expect(preview.conError[0]?.errores[0]).toMatch(/tendría que ser negativo/);
  });

  it("exige importe positivo para cargos con signo fijo (ej. Gasoil) — no lo adivina si viene negativo", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [ENCABEZADO_REAL, filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Gasoil", -1000, "Pago"])],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cargosACrear).toHaveLength(0);
    expect(preview.conError[0]?.errores[0]).toMatch(/tendría que ser positivo/);
  });

  it('"Ajuste por diferencia" acepta importe positivo o negativo (decisión #6)', async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Ajuste por diferencia", -500, "Pago"]),
        filaCliente([2, new Date(Date.UTC(2026, 0, 6)), null, null, null, "Ajuste por diferencia", 500, "Pago"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.conError).toHaveLength(0);
    expect(preview.cargosACrear).toHaveLength(2);
    expect(preview.cargosACrear.map((c) => c.monto).sort()).toEqual([-500, 500]);
  });

  it("completa datos mínimos de cheque (numeroCheque/bancoCheque) para Cheque/Cheque electrónico", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Cheque", -20000, "Pago"]),
        filaCliente([2, new Date(Date.UTC(2026, 0, 6)), null, null, null, "Cheque electrónico", -30000, "Pago"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cobrosACrear).toHaveLength(2);
    for (const cobro of preview.cobrosACrear) {
      expect(cobro.numeroCheque).toMatch(/S\/D/);
      expect(cobro.bancoCheque).toBe("S/D");
    }
    expect(preview.cobrosACrear.find((c) => c.medioPago === MedioPago.CHEQUE)?.monto).toBe(20000);
    expect(preview.cobrosACrear.find((c) => c.medioPago === MedioPago.ECHEQ)?.monto).toBe(30000);
  });

  it("no completa datos de cheque para medios que no lo necesitan", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [ENCABEZADO_REAL, filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Efectivo", -1000, "Pago"])],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cobrosACrear[0]?.numeroCheque).toBeNull();
    expect(preview.cobrosACrear[0]?.bancoCheque).toBeNull();
  });

  it("marca un cliente como nuevo (clienteId null) cuando no matchea ningún cliente ya cargado", async () => {
    const buffer = construirWorkbook({
      "Cliente Sin Cargar": [ENCABEZADO_REAL, filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Efectivo", -1000, "Pago"])],
    });

    const { useCase } = construirCaso([]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.clientesNuevos).toEqual(["Cliente Sin Cargar"]);
    expect(preview.cobrosACrear[0]?.clienteId).toBeNull();
    expect(preview.cobrosACrear[0]?.clienteEsNuevo).toBe(true);
  });

  it("ordena cobros y cargos por fecha y luego por fila", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([2, new Date(Date.UTC(2026, 0, 10)), null, null, null, "Efectivo", -1000, "Pago"]),
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), null, null, null, "Transferencia", -2000, "Pago"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.cobrosACrear.map((c) => c.fecha)).toEqual(["2026-01-05", "2026-01-10"]);
  });
});
