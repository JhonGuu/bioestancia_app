import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";

import { PrevisualizarImportacionBoletas } from "@/modules/boletas/use-cases/importar/previsualizar-importacion-boletas.use-case";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente } from "@/modules/clientes/domain/cliente";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";

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
  const useCase = new PrevisualizarImportacionBoletas(clienteRepository as ClienteRepository);
  return { useCase, clienteRepository };
}

describe("PrevisualizarImportacionBoletas", () => {
  it("agrupa las ventas del mismo cliente y misma fecha en UNA sola boleta a crear", async () => {
    const buffer = construirWorkbook({
      "Acevedo Anibal": [
        ENCABEZADO_REAL,
        filaCliente([52, new Date(Date.UTC(2025, 11, 28)), null, null, null, "Saldo inicial", 1000, "Pago"]),
        filaCliente([53, new Date(Date.UTC(2026, 0, 5)), "Cabeza capón", 1, 100, "Ventas: Cabeza capón: 1 / 100 kg", 325000, "Venta"]),
        filaCliente([53, new Date(Date.UTC(2026, 0, 5)), "Pulpa", 1, 20, "Ventas: Pulpa", 65000, "Venta"]),
        filaCliente([54, new Date(Date.UTC(2026, 0, 6)), "Cabeza chancha", 1, 80, "Ventas: Cabeza chancha", 200000, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "cliente-acevedo", razonSocial: "Acevedo Anibal" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.aCrear).toHaveLength(2); // un grupo por día
    const grupo5deEnero = preview.aCrear.find((g) => g.fecha === "2026-01-05");
    expect(grupo5deEnero?.ventas).toHaveLength(2); // Cabeza capón + Pulpa, mismo día
    expect(grupo5deEnero?.clienteId).toBe("cliente-acevedo");
    expect(grupo5deEnero?.clienteEsNuevo).toBe(false);

    const grupo6deEnero = preview.aCrear.find((g) => g.fecha === "2026-01-06");
    expect(grupo6deEnero?.ventas).toHaveLength(1);

    // Solo cuenta las filas `Tipo: Venta` — el "Saldo inicial" (Pago) no entra acá.
    expect(preview.totalFilasVenta).toBe(3);
  });

  it("calcula precioKg como Importe/Kg, redondeado a 2 decimales", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "Pulpa", 1, 3, "Ventas: Pulpa", 10, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.aCrear[0]?.ventas[0]?.precioKg).toBe(3.33); // 10/3 redondeado
  });

  it("mapea correctamente Forma de venta a FormaVenta + categoría", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "1/2 res capón", 1, 100, "c", 300000, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.aCrear[0]?.ventas[0]).toMatchObject({ formaVenta: FormaVenta.MEDIA_RES, categoria: CategoriaPorcino.CAPON });
  });

  it("reporta como error una forma de venta fuera del catálogo cerrado, sin adivinar", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "Media res chancha", 1, 100, "c", 300000, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.aCrear).toHaveLength(0);
    expect(preview.conError).toHaveLength(1);
    expect(preview.conError[0]?.errores[0]).toMatch(/forma de venta no reconocida/);
  });

  it("exige kg > 0 para formas normales y kg < 0 para compensación de kg — mismo criterio que la carga manual", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        // Kg positivo en una fila que debería venir negativo (compensación).
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "Compensación kg", 1, 10, "c", 30000, "Venta"]),
        // Kg negativo en una fila que debería venir positiva.
        filaCliente([1, new Date(Date.UTC(2026, 0, 6)), "Pulpa", 1, -10, "c", -30000, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.aCrear).toHaveLength(0);
    expect(preview.conError).toHaveLength(2);
    expect(preview.conError.some((e) => e.errores[0]?.includes("negativo"))).toBe(true);
    expect(preview.conError.some((e) => e.errores[0]?.includes("mayor a 0"))).toBe(true);
  });

  it("acepta compensación de kg con kg negativo (kg y precioKg dan un total negativo)", async () => {
    const buffer = construirWorkbook({
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "Compensación kg", 1, -10, "c", -36500, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.conError).toHaveLength(0);
    expect(preview.aCrear[0]?.ventas[0]).toMatchObject({ formaVenta: FormaVenta.COMPENSACION_KG, kg: -10, precioKg: 3650 });
  });

  it("marca un cliente como nuevo (clienteId null) cuando no matchea ningún cliente ya cargado", async () => {
    const buffer = construirWorkbook({
      "Cliente Sin Cargar": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "Pulpa", 1, 10, "c", 30000, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([]); // sin clientes cargados
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.clientesNuevos).toEqual(["Cliente Sin Cargar"]);
    expect(preview.aCrear[0]?.clienteId).toBeNull();
    expect(preview.aCrear[0]?.clienteEsNuevo).toBe(true);
  });

  it("matchea el nombre de la hoja contra el cliente existente sin importar mayúsculas/tildes", async () => {
    const buffer = construirWorkbook({
      "Czybuk Ivan": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "Pulpa", 1, 10, "c", 30000, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "cliente-ivan", razonSocial: "czybuk ívan" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.aCrear[0]?.clienteId).toBe("cliente-ivan");
    expect(preview.clientesNuevos).toEqual([]);
  });

  it("ignora las hojas que no son de cliente (DEUDAS, CHEQUES, etc.) y las que están marcadas para no usar", async () => {
    const buffer = construirWorkbook({
      DEUDAS: [["Nombre", "Saldo"]],
      "Echenique NO USAR": [ENCABEZADO_REAL],
      "Test Cliente": [
        ENCABEZADO_REAL,
        filaCliente([1, new Date(Date.UTC(2026, 0, 5)), "Pulpa", 1, 10, "c", 30000, "Venta"]),
      ],
    });

    const { useCase } = construirCaso([cliente({ id: "c1", razonSocial: "Test Cliente" })]);
    const preview = await useCase.execute({ empresaId: "empresa-1", buffer });

    expect(preview.hojasProcesadas).toEqual(["Test Cliente"]);
    expect(preview.aCrear).toHaveLength(1);
  });
});
