import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { Rubro } from "@/modules/empresas/domain/empresa";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { BoletaAImportar } from "@/modules/boletas/domain/importacion-boletas";
import { ConfirmarImportacionBoletas } from "@/modules/boletas/use-cases/importar/confirmar-importacion-boletas.use-case";

/**
 * Test de integración: el flujo REAL de `ConfirmarImportacionBoletas` de
 * punta a punta contra Postgres — sin mockear ningún repositorio. Cubre lo
 * que un test con mocks no puede: que `ClienteRepository.create` realmente
 * persiste con `razonSocial` (sin nombre/apellido), que `BoletaRepository`/
 * `VentaRepository` aceptan y devuelven `precioKg`/`total` correctamente
 * calculados, y — el riesgo real que motivó todo este importador — que
 * NINGÚN asiento automático se genera para el operativo histórico (ver
 * `plan-carga-inicial-datos.md`: ese efecto ya lo cubre el asiento de
 * apertura, generarlo acá también duplicaría la plata contabilizada).
 *
 * Correr con `pnpm test:integration`, nunca con `pnpm test`.
 */
describe("ConfirmarImportacionBoletas — integración de punta a punta contra Postgres real", () => {
  const container = DI.getInstance().container;
  const db = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);
  let empresaId: string;

  beforeAll(async () => {
    await db.clear();
    const empresaRepository = container.get<EmpresaRepository>(DI_TYPES.EmpresaRepository);
    const empresa = await empresaRepository.create({ razonSocial: "Bioestancia (test)", rubro: Rubro.FRIGORIFICO });
    empresaId = empresa.id;
  });

  afterAll(async () => {
    await db.close();
  });

  it("crea el cliente automáticamente (razonSocial = nombre de hoja) y la boleta con sus ventas ya con precio", async () => {
    const confirmarImportacionBoletas = container.get<ConfirmarImportacionBoletas>(DI_TYPES.ConfirmarImportacionBoletas);

    const grupo: BoletaAImportar = {
      hoja: "Cliente De Prueba",
      clienteId: null,
      clienteEsNuevo: true,
      fecha: "2026-01-05",
      filas: [13, 14],
      ventas: [
        { fila: 13, formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CAPON, kg: 100, precioKg: 3250, observaciones: null },
        { fila: 14, formaVenta: FormaVenta.PULPA, categoria: null, kg: 20, precioKg: 3250, observaciones: "Ventas: Pulpa" },
      ],
      totalImporte: 390000,
    };

    const resultado = await confirmarImportacionBoletas.execute({ empresaId, boletas: [grupo] });

    expect(resultado.creadas).toBe(1);
    expect(resultado.fallidas).toBe(0);
    const boletaId = resultado.detalle[0]?.boletaId;
    expect(boletaId).toBeDefined();

    // 1. El cliente se creó de verdad, con razonSocial = nombre de la hoja.
    const clienteRepository = container.get<ClienteRepository>(DI_TYPES.ClienteRepository);
    const clientes = await clienteRepository.list(empresaId);
    const clienteCreado = clientes.find((c) => c.razonSocial === "Cliente De Prueba");
    expect(clienteCreado).toBeDefined();
    expect(clienteCreado?.condicionFiscal).toBe(CondicionFiscal.CONSUMIDOR_FINAL);
    expect(clienteCreado?.nombre).toBeNull();

    // 2. La boleta y sus dos ventas quedaron persistidas con precioKg/total correctos.
    const boletaRepository = container.get<BoletaRepository>(DI_TYPES.BoletaRepository);
    const boleta = await boletaRepository.getById(boletaId!, empresaId);
    expect(boleta?.clienteId).toBe(clienteCreado!.id);

    const ventaRepository = container.get<VentaRepository>(DI_TYPES.VentaRepository);
    const ventas = await ventaRepository.listByBoleta(boletaId!, empresaId);
    expect(ventas).toHaveLength(2);
    expect(ventas.find((v) => v.formaVenta === FormaVenta.CABEZA)?.total).toBe(325000);
    expect(ventas.find((v) => v.formaVenta === FormaVenta.PULPA)?.total).toBe(65000);

    // 3. Ninguna venta histórica dispara un asiento automático — ese efecto
    //    acumulado lo cubre el asiento de apertura al final de la migración,
    //    no cada documento histórico individualmente (ver doc de la clase).
    const asientoRepository = container.get<AsientoRepository>(DI_TYPES.AsientoRepository);
    const asiento = await asientoRepository.getByOrigen(empresaId, "boleta", boletaId!);
    expect(asiento).toBeNull();
  });

  it("un segundo grupo de la MISMA hoja reusa el cliente ya creado, no crea uno nuevo", async () => {
    const confirmarImportacionBoletas = container.get<ConfirmarImportacionBoletas>(DI_TYPES.ConfirmarImportacionBoletas);
    const clienteRepository = container.get<ClienteRepository>(DI_TYPES.ClienteRepository);

    const clientesAntes = await clienteRepository.list(empresaId);
    const cantidadAntes = clientesAntes.filter((c) => c.razonSocial === "Cliente De Prueba").length;
    expect(cantidadAntes).toBe(1); // creado en el test anterior

    const grupo: BoletaAImportar = {
      hoja: "Cliente De Prueba",
      clienteId: null,
      clienteEsNuevo: true,
      fecha: "2026-01-06",
      filas: [15],
      ventas: [{ fila: 15, formaVenta: FormaVenta.CABEZA, categoria: CategoriaPorcino.CERDA_CHANCHA, kg: 50, precioKg: 2000, observaciones: null }],
      totalImporte: 100000,
    };

    const resultado = await confirmarImportacionBoletas.execute({ empresaId, boletas: [grupo] });

    expect(resultado.creadas).toBe(1);
    const clientesDespues = await clienteRepository.list(empresaId);
    expect(clientesDespues.filter((c) => c.razonSocial === "Cliente De Prueba")).toHaveLength(1); // sigue siendo uno solo
  });
});
