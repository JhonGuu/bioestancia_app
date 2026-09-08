import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { Rubro } from "@/modules/empresas/domain/empresa";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { CuentaRepository } from "@/modules/contabilidad/domain/cuenta.repository";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";
import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { EjercicioRepository } from "@/modules/contabilidad/domain/ejercicio.repository";
import { generarPeriodos } from "@/modules/contabilidad/domain/ejercicio";
import { ReglaAsientoRepository } from "@/modules/contabilidad/domain/regla-asiento.repository";
import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";
import { BoletaRepository } from "@/modules/boletas/domain/boleta.repository";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { MedioPago } from "@/modules/cobros/domain/medio-pago";
import { CobroRepository } from "@/modules/cobros/domain/cobro.repository";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { EstadoAsiento, TipoAsiento, estaBalanceado } from "@/modules/contabilidad/domain/asiento";
import { CreateCobro } from "@/modules/cobros/use-cases/create-cobro.use-case";

/**
 * Test de integración: el flujo REAL de `CreateCobro` de punta a punta
 * contra Postgres — no mockeamos ningún repositorio. A diferencia de
 * `aplicar-cobro-fifo.use-case.test.ts` (que prueba el algoritmo FIFO en
 * aislamiento con repos mockeados), esto verifica que las piezas realmente
 * encajan: crear el cobro, aplicar FIFO, persistir las aplicaciones Y
 * generar el asiento automático correspondiente, todo en la misma
 * transacción de negocio, leyendo después la base real para confirmar cada
 * efecto — no lo que el use-case "dice" que hizo.
 *
 * Requiere `DB_URL` apuntando a una base descartable (ver
 * `vitest.integration.setup.ts`) — `DrizzleAdapter.clear()` la trunca
 * ENTERA antes de sembrar los datos de este archivo. Correr con
 * `pnpm test:integration`, nunca con `pnpm test`.
 */
describe("CreateCobro — integración de punta a punta contra Postgres real", () => {
  const container = DI.getInstance().container;
  const db = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);

  let empresaId: string;
  let clienteId: string;
  let cajaId: string;
  let deudoresId: string;
  let boletaViejaId: string;
  let boletaNuevaId: string;
  let primerAsientoId: string;

  beforeAll(async () => {
    await db.clear();

    const empresaRepository = container.get<EmpresaRepository>(DI_TYPES.EmpresaRepository);
    const empresa = await empresaRepository.create({ razonSocial: "Bioestancia (test)", rubro: Rubro.FRIGORIFICO });
    empresaId = empresa.id;

    const clienteRepository = container.get<ClienteRepository>(DI_TYPES.ClienteRepository);
    const cliente = await clienteRepository.create({
      empresaId,
      nombre: "Juan",
      apellido: "Pérez",
      condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    });
    clienteId = cliente.id;

    // Plan de cuentas mínimo: Caja (sin auxiliar) y Deudores por Ventas
    // (control por cliente) — alcanza para armar un asiento de cobro
    // balanceado de dos líneas.
    const cuentaRepository = container.get<CuentaRepository>(DI_TYPES.CuentaRepository);
    const [caja, deudores] = await cuentaRepository.createMany([
      { empresaId, codigo: "1.1.01", nombre: "Caja", tipo: TipoCuenta.ACTIVO, imputable: true, monetaria: true },
      {
        empresaId,
        codigo: "1.1.03",
        nombre: "Deudores por Ventas",
        tipo: TipoCuenta.ACTIVO,
        imputable: true,
        monetaria: true,
        requiereAuxiliar: TipoAuxiliar.CLIENTE,
      },
    ]);
    cajaId = caja!.id;
    deudoresId = deudores!.id;

    // Ejercicio 2026 abierto, con sus 12 períodos — GenerarAsientosAutomaticos
    // necesita ubicar la fecha del cobro en un ejercicio/período abiertos
    // (ResolverContextoAsiento) antes de poder crear el asiento.
    const ejercicioRepository = container.get<EjercicioRepository>(DI_TYPES.EjercicioRepository);
    const fechaInicio = new Date("2026-01-01");
    const fechaFin = new Date("2026-12-31");
    const ejercicio = await ejercicioRepository.create({ empresaId, numero: 1, nombre: "2026", fechaInicio, fechaFin });
    await ejercicioRepository.createPeriodos(ejercicio.id, generarPeriodos(fechaInicio, fechaFin));

    // Una única regla, sin condición — aplica a cualquier cobro sin importar
    // el medio de pago: debe Caja / haber Deudores (con el cliente como auxiliar).
    const reglaAsientoRepository = container.get<ReglaAsientoRepository>(DI_TYPES.ReglaAsientoRepository);
    await reglaAsientoRepository.create({
      empresaId,
      evento: EventoAsiento.COBRO_REGISTRADO,
      nombre: "Cobro genérico",
      lineas: [
        { lado: "debe", cuentaId: cajaId, expresion: "monto" },
        { lado: "haber", cuentaId: deudoresId, expresion: "monto", auxiliarResolver: "cliente" },
      ],
    });

    // Dos boletas ya facturadas del cliente, para que el FIFO tenga a quién
    // aplicarle el cobro: la vieja (enero, $1000) y la nueva (febrero, $800).
    const boletaRepository = container.get<BoletaRepository>(DI_TYPES.BoletaRepository);
    const ventaRepository = container.get<VentaRepository>(DI_TYPES.VentaRepository);

    const boletaVieja = await boletaRepository.create({
      empresaId,
      clienteId,
      fecha: new Date("2026-01-05"),
      fechaVencimiento: new Date("2026-01-15"),
    });
    boletaViejaId = boletaVieja.id;
    await ventaRepository.create({
      empresaId,
      clienteId,
      boletaId: boletaViejaId,
      formaVenta: FormaVenta.MEDIA_RES,
      kg: 100,
      precioKg: 10,
      total: 1000,
      fecha: boletaVieja.fecha,
    });

    const boletaNueva = await boletaRepository.create({
      empresaId,
      clienteId,
      fecha: new Date("2026-02-05"),
      fechaVencimiento: new Date("2026-02-15"),
    });
    boletaNuevaId = boletaNueva.id;
    await ventaRepository.create({
      empresaId,
      clienteId,
      boletaId: boletaNuevaId,
      formaVenta: FormaVenta.MEDIA_RES,
      kg: 80,
      precioKg: 10,
      total: 800,
      fecha: boletaNueva.fecha,
    });
  });

  afterAll(async () => {
    await db.close();
  });

  it("aplica el cobro FIFO a la boleta más vieja primero y genera un asiento automático balanceado — todo persistido en la base real", async () => {
    const createCobro = container.get<CreateCobro>(DI_TYPES.CreateCobro);

    const cobro = await createCobro.execute({
      empresaId,
      clienteId,
      fecha: new Date("2026-01-10"),
      lineas: [{ medioPago: MedioPago.EFECTIVO, monto: 1500 }],
    });

    expect(cobro.lineas).toHaveLength(1);
    expect(cobro.lineas[0]?.monto).toBe(1500);

    // 1. Las aplicaciones quedaron persistidas: la vieja se salda entera
    //    (1000) y la nueva recibe el resto (500 de 800) — FIFO por fecha,
    //    no por orden de creación.
    const cobroRepository = container.get<CobroRepository>(DI_TYPES.CobroRepository);
    const aplicaciones = await cobroRepository.listAplicacionesByCliente(clienteId, empresaId);
    expect(aplicaciones).toHaveLength(2);
    expect(aplicaciones.find((a) => a.boletaId === boletaViejaId)?.monto).toBe(1000);
    expect(aplicaciones.find((a) => a.boletaId === boletaNuevaId)?.monto).toBe(500);

    // 2. El asiento automático se creó de verdad, ligado a este cobro por
    //    origenTipo/origenId, en BORRADOR, y balancea (debe === haber) con
    //    las cuentas y el auxiliar correctos — no confiamos en lo que
    //    `GenerarAsientosAutomaticos` "dice" que hizo, lo releemos de la base.
    const asientoRepository = container.get<AsientoRepository>(DI_TYPES.AsientoRepository);
    const asiento = await asientoRepository.getByOrigen(empresaId, "cobro", cobro.id);
    expect(asiento).not.toBeNull();
    primerAsientoId = asiento!.id;
    expect(asiento?.tipo).toBe(TipoAsiento.AUTOMATICO);
    expect(asiento?.estado).toBe(EstadoAsiento.BORRADOR);
    expect(estaBalanceado(asiento!.lineas)).toBe(true);
    expect(asiento?.lineas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cuentaId: cajaId, debe: 1500, haber: 0 }),
        expect.objectContaining({
          cuentaId: deudoresId,
          debe: 0,
          haber: 1500,
          auxiliarTipo: TipoAuxiliar.CLIENTE,
          auxiliarId: clienteId,
        }),
      ]),
    );
  });

  it("un segundo cobro por el saldo restante genera OTRO asiento independiente (no reabre el anterior)", async () => {
    const createCobro = container.get<CreateCobro>(DI_TYPES.CreateCobro);

    const cobro2 = await createCobro.execute({
      empresaId,
      clienteId,
      fecha: new Date("2026-02-20"),
      lineas: [{ medioPago: MedioPago.TRANSFERENCIA_BANCO, monto: 300 }],
    });

    // La boleta nueva queda saldada del todo: 500 (primer cobro) + 300 (este).
    const cobroRepository = container.get<CobroRepository>(DI_TYPES.CobroRepository);
    const aplicaciones = await cobroRepository.listAplicacionesByCliente(clienteId, empresaId);
    const totalBoletaNueva = aplicaciones.filter((a) => a.boletaId === boletaNuevaId).reduce((acc, a) => acc + a.monto, 0);
    expect(totalBoletaNueva).toBe(800);

    // Segundo asiento, con su propio origenId — el del primer cobro sigue
    // intacto (ver test anterior), esto no lo pisa ni lo reutiliza.
    const asientoRepository = container.get<AsientoRepository>(DI_TYPES.AsientoRepository);
    const asiento2 = await asientoRepository.getByOrigen(empresaId, "cobro", cobro2.id);
    expect(asiento2).not.toBeNull();
    expect(asiento2?.id).not.toBe(primerAsientoId);
    expect(estaBalanceado(asiento2!.lineas)).toBe(true);
    expect(asiento2?.lineas.find((l) => l.cuentaId === cajaId)?.debe).toBe(300);
  });
});
