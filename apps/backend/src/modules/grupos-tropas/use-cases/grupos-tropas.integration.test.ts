import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { Rubro } from "@/modules/empresas/domain/empresa";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { CreateCompra } from "@/modules/compras/use-cases/create-compra.use-case";
import { CerrarCompra } from "@/modules/compras/use-cases/cerrar-compra.use-case";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { CreateVenta } from "@/modules/ventas/use-cases/create-venta.use-case";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CrearGrupoTropas } from "@/modules/grupos-tropas/use-cases/crear-grupo-tropas.use-case";
import { CerrarGrupoTropas } from "@/modules/grupos-tropas/use-cases/cerrar-grupo-tropas.use-case";
import { ReabrirGrupoTropas } from "@/modules/grupos-tropas/use-cases/reabrir-grupo-tropas.use-case";
import { ApiError } from "@/shared/infra/http/api.responses";

/**
 * Integración de punta a punta contra Postgres real del flujo "Grupo de
 * tropas" (ver `plan-unificacion-tropas-despacho.md`): el caso real de
 * Motape — 100 animales en la tropa original + 1 animal de más descubierto
 * al faenar, que se carga como una segunda tropa y se agrupa con la primera
 * para calcular un único rinde de despacho.
 *
 * Corre con `pnpm test:integration`, nunca con `pnpm test`.
 */
describe("Grupo de tropas — integración de punta a punta contra Postgres real", () => {
  const container = DI.getInstance().container;
  const db = container.get<DrizzleAdapter>(DI_TYPES.DBConnection);
  let empresaId: string;
  let proveedorId: string;
  let clienteId: string;

  beforeAll(async () => {
    await db.clear();
    const empresaRepository = container.get<EmpresaRepository>(DI_TYPES.EmpresaRepository);
    const empresa = await empresaRepository.create({ razonSocial: "Bioestancia (test)", rubro: Rubro.FRIGORIFICO });
    empresaId = empresa.id;

    const proveedorRepository = container.get<ProveedorRepository>(DI_TYPES.ProveedorRepository);
    const proveedor = await proveedorRepository.create({
      empresaId,
      razonSocial: "Motape",
      condicionFiscal: CondicionFiscal.RESPONSABLE_INSCRIPTO,
      porcentajeDesbaste: 6,
    });
    proveedorId = proveedor.id;

    const clienteRepository = container.get<ClienteRepository>(DI_TYPES.ClienteRepository);
    const cliente = await clienteRepository.create({
      empresaId,
      razonSocial: "Cliente comprador",
      condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    });
    clienteId = cliente.id;
  });

  afterAll(async () => {
    await db.close();
  });

  it("agrupa 2 tropas, reparte el peso proporcional a las cabezas y reconcilia el cierre a nivel de grupo", async () => {
    const createCompra = container.get<CreateCompra>(DI_TYPES.CreateCompra);

    // Tropa original: 100 animales, 15.000 kg brutos (el peso real que en
    // verdad correspondía a 101 animales, se descubre después).
    const compraOriginal = await createCompra.execute({
      empresaId,
      proveedorId,
      numero: "100",
      especie: EspecieAnimal.PORCINO,
      fecha: new Date("2026-02-01"),
      dte: "032369757-4",
      remito: "0001-000100",
      precioCompraKg: 1500,
      porcentajeDesbaste: 6,
      pesoBruto: 15000, // se corrige a 15000*100/101 al agrupar
      categorias: [{ categoria: CategoriaPorcino.CAPON, cabezas: 100 }],
    });

    // Tropa nueva para el animal de más, cargada con un DTE adicional.
    const compraAdicional = await createCompra.execute({
      empresaId,
      proveedorId,
      numero: "100-B",
      especie: EspecieAnimal.PORCINO,
      fecha: new Date("2026-02-01"),
      dte: "032369757-5",
      remito: "0001-000101",
      precioCompraKg: 1500,
      porcentajeDesbaste: 6,
      pesoBruto: 1, // placeholder, se corrige al agrupar
      categorias: [{ categoria: CategoriaPorcino.CAPON, cabezas: 1 }],
    });

    const crearGrupoTropas = container.get<CrearGrupoTropas>(DI_TYPES.CrearGrupoTropas);
    const grupo = await crearGrupoTropas.execute({
      empresaId,
      compraIds: [compraOriginal.id, compraAdicional.id],
      pesoBrutoTotal: 15150, // el peso real del grupo entero (101 animales)
      nombre: "Tropas 100/100-B",
    });

    // Reparto proporcional: 100/101 y 1/101 de 15150 → 15000 y 150.
    const miembroOriginal = grupo.compras.find((c) => c.id === compraOriginal.id)!;
    const miembroAdicional = grupo.compras.find((c) => c.id === compraAdicional.id)!;
    expect(miembroOriginal.pesoBruto).toBe(15000);
    expect(miembroAdicional.pesoBruto).toBe(150);
    expect(miembroOriginal.grupoTropasId).toBe(grupo.id);
    expect(miembroAdicional.grupoTropasId).toBe(grupo.id);
    expect(grupo.pesoBrutoTotal).toBe(15150);
    expect(grupo.pesoNetoTotal).toBeCloseTo(15150 * 0.94, 1);

    // No se puede cerrar una tropa del grupo individualmente mientras esté abierto.
    const cerrarCompra = container.get<CerrarCompra>(DI_TYPES.CerrarCompra);
    await expect(cerrarCompra.execute({ id: compraOriginal.id, empresaId })).rejects.toThrow(ApiError);

    // Se despachan las 101 cabezas sin distinguir de qué tropa salió cada una
    // (el caso real que motiva agrupar) — algunas ventas apuntan a una
    // tropa, otras a la otra, y el cierre del GRUPO reconcilia la suma.
    const createVenta = container.get<CreateVenta>(DI_TYPES.CreateVenta);
    for (let i = 0; i < 90; i++) {
      await createVenta.execute({
        empresaId,
        clienteId,
        boletaId: null,
        compraId: compraOriginal.id,
        garron: i + 1,
        formaVenta: FormaVenta.CABEZA,
        categoria: CategoriaPorcino.CAPON,
        kg: 130,
        precioKg: 2000,
        fecha: new Date("2026-02-10"),
        clienteFinalId: null,
      });
    }
    for (let i = 90; i < 101; i++) {
      await createVenta.execute({
        empresaId,
        clienteId,
        boletaId: null,
        compraId: compraAdicional.id,
        garron: i + 1,
        formaVenta: FormaVenta.CABEZA,
        categoria: CategoriaPorcino.CAPON,
        kg: 130,
        precioKg: 2000,
        fecha: new Date("2026-02-10"),
        clienteFinalId: null,
      });
    }

    const cerrarGrupoTropas = container.get<CerrarGrupoTropas>(DI_TYPES.CerrarGrupoTropas);
    const grupoCerrado = await cerrarGrupoTropas.execute({ id: grupo.id, empresaId });

    expect(grupoCerrado.cerrado).toBe(true);
    expect(grupoCerrado.alertaSuperavit).toBe(false);
    expect(grupoCerrado.pesoFinalVentaTotal).toBe(101 * 130);
    expect(grupoCerrado.rinde).toBeCloseTo((101 * 130) / (15150 * 0.94) * 100, 1);
    // Cada miembro queda cerrado pero SIN rinde propio (vive una sola vez, en el grupo).
    const miembroOriginalCerrado = grupoCerrado.compras.find((c) => c.id === compraOriginal.id)!;
    expect(miembroOriginalCerrado.cerrada).toBe(true);
    expect(miembroOriginalCerrado.rinde).toBeNull();
    expect(miembroOriginalCerrado.pesoFinalVenta).toBe(90 * 130);

    // Reabrir el grupo reabre TODAS las tropas miembro a la vez.
    const reabrirGrupoTropas = container.get<ReabrirGrupoTropas>(DI_TYPES.ReabrirGrupoTropas);
    const grupoReabierto = await reabrirGrupoTropas.execute({ id: grupo.id, empresaId });
    expect(grupoReabierto.cerrado).toBe(false);
    expect(grupoReabierto.compras.every((c) => !c.cerrada)).toBe(true);
  });
});
