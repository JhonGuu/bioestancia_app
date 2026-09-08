import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { Rubro } from "@/modules/empresas/domain/empresa";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { CreateVenta } from "@/modules/ventas/use-cases/create-venta.use-case";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { ChequeRepository } from "@/modules/cheques/domain/cheque.repository";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { CargoCuentaCorrienteRepository } from "@/modules/cargos-cuenta-corriente/domain/cargo-cuenta-corriente.repository";
import { TipoCargo } from "@/modules/cargos-cuenta-corriente/domain/tipo-cargo";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { CobroAImportar, CargoAImportar } from "@/modules/cobros/domain/importacion-cobros";
import { ConfirmarImportacionCobros } from "@/modules/cobros/use-cases/importar/confirmar-importacion-cobros.use-case";

/**
 * Test de integración: el flujo REAL de `ConfirmarImportacionCobros` de
 * punta a punta contra Postgres — sin mockear ningún repositorio. Cubre lo
 * que un test con mocks no puede: que el FIFO real (`AplicarCobroFifo`) se
 * reconstruye contra una boleta ya persistida, que `ChequeRepository.create`
 * acepta los datos mínimos (placeholder) sin romper, y — el riesgo real que
 * motivó todo este importador — que NINGÚN asiento automático se genera para
 * el cobro/cargo histórico (ver `plan-carga-inicial-datos.md`: ese efecto ya
 * lo cubre el asiento de apertura, generarlo acá también duplicaría la
 * plata contabilizada).
 *
 * Correr con `pnpm test:integration`, nunca con `pnpm test`.
 */
describe("ConfirmarImportacionCobros — integración de punta a punta contra Postgres real", () => {
  const container = DI.getInstance().container;
  const db = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);
  let empresaId: string;
  let clienteId: string;
  let boletaId: string;

  beforeAll(async () => {
    await db.clear();
    const empresaRepository = container.get<EmpresaRepository>(DI_TYPES.EmpresaRepository);
    const empresa = await empresaRepository.create({ razonSocial: "Bioestancia (test)", rubro: Rubro.FRIGORIFICO });
    empresaId = empresa.id;

    // Boleta+venta ya cargada (como haría el importador de boletas, Etapa 1)
    // para que el FIFO tenga algo pendiente contra qué aplicar el cobro.
    const clienteRepository = container.get<ClienteRepository>(DI_TYPES.ClienteRepository);
    const cliente = await clienteRepository.create({
      empresaId,
      razonSocial: "Cliente Con Boleta",
      condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    });
    clienteId = cliente.id;

    const boletaRepository = container.get<BoletaRepository>(DI_TYPES.BoletaRepository);
    const fecha = new Date("2026-01-05T00:00:00.000Z");
    const boleta = await boletaRepository.create({
      empresaId,
      clienteId,
      fecha,
      fechaVencimiento: new Date("2026-01-12T00:00:00.000Z"),
      comentarios: "Boleta de prueba para el FIFO",
    });
    boletaId = boleta.id;

    const createVenta = container.get<CreateVenta>(DI_TYPES.CreateVenta);
    await createVenta.execute({
      empresaId,
      clienteId,
      boletaId,
      compraId: null,
      garron: null,
      formaVenta: FormaVenta.CABEZA,
      categoria: CategoriaPorcino.CAPON,
      kg: 100,
      precioKg: 1000,
      fecha,
      clienteFinalId: null,
    });
    // Boleta queda con total = 100 * 1000 = 100000.
  });

  afterAll(async () => {
    await db.close();
  });

  it("aplica el cobro histórico por FIFO contra la boleta ya cargada, sin generar ningún asiento automático", async () => {
    const confirmarImportacionCobros = container.get<ConfirmarImportacionCobros>(DI_TYPES.ConfirmarImportacionCobros);

    const cobro: CobroAImportar = {
      hoja: "Cliente Con Boleta",
      clienteId,
      clienteEsNuevo: false,
      fila: 20,
      fecha: "2026-01-08",
      medioPago: MedioPago.EFECTIVO,
      monto: 60000, // paga solo una parte de la boleta de 100000
      numeroCheque: null,
      bancoCheque: null,
      observaciones: null,
    };

    const resultado = await confirmarImportacionCobros.execute({ empresaId, cobros: [cobro], cargos: [] });

    expect(resultado.creados).toBe(1);
    expect(resultado.fallidos).toBe(0);
    const cobroId = resultado.detalle[0]?.id;
    expect(cobroId).toBeDefined();

    // El FIFO aplicó los 60000 contra la única boleta pendiente.
    const cobroRepository = container.get<CobroRepository>(DI_TYPES.CobroRepository);
    const aplicaciones = await cobroRepository.listAplicacionesByCliente(clienteId, empresaId);
    expect(aplicaciones).toHaveLength(1);
    expect(aplicaciones[0]).toMatchObject({ boletaId, monto: 60000 });

    // Ningún asiento automático — ni para el cobro.
    const asientoRepository = container.get<AsientoRepository>(DI_TYPES.AsientoRepository);
    const asientoCobro = await asientoRepository.getByOrigen(empresaId, "cobro", cobroId!);
    expect(asientoCobro).toBeNull();
  });

  it("crea el Cheque con datos mínimos cuando el medioPago es CHEQUE, sin romper por falta de número/banco reales", async () => {
    const confirmarImportacionCobros = container.get<ConfirmarImportacionCobros>(DI_TYPES.ConfirmarImportacionCobros);

    const cobro: CobroAImportar = {
      hoja: "Cliente Con Boleta",
      clienteId,
      clienteEsNuevo: false,
      fila: 21,
      fecha: "2026-01-09",
      medioPago: MedioPago.CHEQUE,
      monto: 15000,
      numeroCheque: "S/D (fila 21)",
      bancoCheque: "S/D",
      observaciones: null,
    };

    const resultado = await confirmarImportacionCobros.execute({ empresaId, cobros: [cobro], cargos: [] });
    expect(resultado.creados).toBe(1);

    const chequeRepository = container.get<ChequeRepository>(DI_TYPES.ChequeRepository);
    const cheques = await chequeRepository.list(empresaId, { clienteId });
    const chequeCreado = cheques.find((c) => c.numero === "S/D (fila 21)");
    expect(chequeCreado).toBeDefined();
    expect(chequeCreado?.banco).toBe("S/D");
    expect(chequeCreado?.monto).toBe(15000);
  });

  it("crea el cargo directo (sin CreateCargoCuentaCorriente) y tampoco genera asiento automático", async () => {
    const confirmarImportacionCobros = container.get<ConfirmarImportacionCobros>(DI_TYPES.ConfirmarImportacionCobros);

    const cargo: CargoAImportar = {
      hoja: "Cliente Con Boleta",
      clienteId,
      clienteEsNuevo: false,
      fila: 22,
      fecha: "2026-01-10",
      tipo: TipoCargo.OTRO,
      monto: 5000,
      motivo: "Gasoil",
    };

    const resultado = await confirmarImportacionCobros.execute({ empresaId, cobros: [], cargos: [cargo] });
    expect(resultado.creados).toBe(1);
    const cargoId = resultado.detalle[0]?.id;
    expect(cargoId).toBeDefined();

    const cargoCuentaCorrienteRepository = container.get<CargoCuentaCorrienteRepository>(DI_TYPES.CargoCuentaCorrienteRepository);
    const cargoCreado = await cargoCuentaCorrienteRepository.getById(cargoId!, empresaId);
    expect(cargoCreado).toMatchObject({ tipo: TipoCargo.OTRO, monto: 5000, clienteId });

    const asientoRepository = container.get<AsientoRepository>(DI_TYPES.AsientoRepository);
    const asientoCargo = await asientoRepository.getByOrigen(empresaId, "cargo_cuenta_corriente", cargoId!);
    expect(asientoCargo).toBeNull();
  });
});
