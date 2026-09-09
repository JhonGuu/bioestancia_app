import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DI } from "@/shared/infra/di/di";
import { DI_TYPES } from "@/shared/infra/di/types";
import { DrizzleAdapter } from "@/shared/infra/database/db-connection";
import { EmpresaRepository } from "@/modules/empresas/domain/empresa.repository";
import { Rubro } from "@/modules/empresas/domain/empresa";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { ResultadoFaenaRepository } from "@/modules/resultado-faena/domain/resultado-faena.repository";
import { LiquidacionCompraRepository } from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { LiquidacionFaenaRepository } from "@/modules/liquidacion-faena/domain/liquidacion-faena.repository";
import { AsientoRepository } from "@/modules/contabilidad/domain/asiento.repository";
import { CompraAImportar } from "@/modules/compras/domain/importacion-compras";
import { ConfirmarImportacionCompras } from "@/modules/compras/use-cases/importar/confirmar-importacion-compras.use-case";

/**
 * Test de integración: el flujo REAL de `ConfirmarImportacionCompras` de
 * punta a punta contra Postgres — sin mockear ningún repositorio. Cubre lo
 * que un test con mocks no puede: que el proveedor/frigorífico se crean de
 * verdad cuando no existen, que la cadena completa de documentos
 * (`Compra` → `CompraCategoria` → `ResultadoFaena` → `LiquidacionCompra` →
 * `LiquidacionFaena`) queda persistida y consistente entre sí, y — el
 * riesgo real que motivó todo este importador — que NINGÚN asiento
 * automático se genera para ninguno de los tres eventos que normalmente lo
 * disparan (`compra`, `liquidacion_compra`, `liquidacion_faena`), ver
 * `plan-carga-inicial-datos.md`.
 *
 * Correr con `pnpm test:integration`, nunca con `pnpm test`.
 */
describe("ConfirmarImportacionCompras — integración de punta a punta contra Postgres real", () => {
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

  it("crea proveedor y frigorífico nuevos, la cadena completa de documentos, y ningún asiento automático", async () => {
    const confirmarImportacionCompras = container.get<ConfirmarImportacionCompras>(DI_TYPES.ConfirmarImportacionCompras);

    const compraAImportar: CompraAImportar = {
      fila: 3,
      numero: "5024-CLA",
      proveedorNombre: "Cerdo De Los Llanos (test)",
      proveedorId: null,
      frigorificoNombre: "Cerdo De Los Andes S.A. (test)",
      frigorificoId: null,
      fecha: "2025-01-15",
      fechaFaena: "2025-01-17",
      dte: "028542056-3",
      remito: "026-0293",
      precioCompraKg: 1723,
      pesoBruto: 28460,
      pesoNeto: 27246,
      porcentajeDesbaste: 4.27,
      categorias: [
        { categoria: CategoriaPorcino.CAPON, cabezas: 80 },
        { categoria: CategoriaPorcino.MACHOS_ENTEROS_INMUNOCASTRADOS, cabezas: 70 },
      ],
      kgVivoTotalFaena: 27246,
      kgCarneTotalFaena: 20808.7,
      numeroComprobanteLiquidacion: "S/D (tropa 5024-CLA)",
      porcentajeIvaLiquidacion: 10.5,
      montoFaenaTotal: 2724000,
      rentabilidadReferenciaExcel: "Datos de referencia del Excel original (no recalculados por el sistema): ganancia $3600635.83 · rentabilidad bruta facturada 14.12%",
    };

    const resultado = await confirmarImportacionCompras.execute({ empresaId, compras: [compraAImportar] });

    expect(resultado.creadas).toBe(1);
    expect(resultado.fallidas).toBe(0);
    const compraId = resultado.detalle[0]?.compraId;
    expect(compraId).toBeDefined();

    // El proveedor y el frigorífico se crearon de verdad, con el nombre de la planilla.
    const proveedorRepository = container.get<ProveedorRepository>(DI_TYPES.ProveedorRepository);
    const proveedores = await proveedorRepository.list(empresaId);
    const proveedorCreado = proveedores.find((p) => p.razonSocial === "Cerdo De Los Llanos (test)");
    expect(proveedorCreado).toBeDefined();

    const frigorificoRepository = container.get<FrigorificoRepository>(DI_TYPES.FrigorificoRepository);
    const frigorificos = await frigorificoRepository.list(empresaId);
    const frigorificoCreado = frigorificos.find((f) => f.nombre === "Cerdo De Los Andes S.A. (test)");
    expect(frigorificoCreado).toBeDefined();

    // La compra quedó con los datos esperados y SIN comentarios inventados —
    // el texto guardado es exactamente la rentabilidad de referencia del Excel.
    const compraRepository = container.get<CompraRepository>(DI_TYPES.CompraRepository);
    const compra = await compraRepository.getById(compraId!, empresaId);
    expect(compra).toMatchObject({
      numero: "5024-CLA",
      proveedorId: proveedorCreado!.id,
      pesoBruto: 28460,
      pesoNeto: 27246,
      cerrada: false,
      comentarios: expect.stringContaining("rentabilidad bruta facturada 14.12%"),
    });

    // Las dos líneas de categoría existen con las cabezas parseadas y su
    // detalle de faena/liquidación/canon ya completo (sumando exacto a los totales).
    const compraCategoriaRepository = container.get<CompraCategoriaRepository>(DI_TYPES.CompraCategoriaRepository);
    const lineas = await compraCategoriaRepository.listByCompra(compraId!);
    expect(lineas).toHaveLength(2);
    const sumaCabezas = lineas.reduce((acc, l) => acc + l.cabezas, 0);
    expect(sumaCabezas).toBe(150);
    const sumaKgVivoFaena = lineas.reduce((acc, l) => acc + (l.kgVivoFaena ?? 0), 0);
    expect(sumaKgVivoFaena).toBeCloseTo(27246, 5);
    const sumaImporteBruto = lineas.reduce((acc, l) => acc + (l.importeBruto ?? 0), 0);
    expect(sumaImporteBruto).toBeCloseTo(27246 * 1723, 0);
    const sumaCanonFaenaSubtotal = lineas.reduce((acc, l) => acc + (l.canonFaenaSubtotal ?? 0), 0);
    expect(sumaCanonFaenaSubtotal).toBeCloseTo(2724000, 5);

    // ResultadoFaena, LiquidacionCompra y LiquidacionFaena quedaron persistidos, 1 a 1 con la compra.
    const resultadoFaenaRepository = container.get<ResultadoFaenaRepository>(DI_TYPES.ResultadoFaenaRepository);
    const resultadoFaena = await resultadoFaenaRepository.getByCompraId(compraId!, empresaId);
    expect(resultadoFaena).toMatchObject({ kgVivoTotal: 27246, kgCarneTotal: 20808.7 });
    expect(resultadoFaena!.rendimiento).toBeCloseTo((20808.7 / 27246) * 100, 1);

    const liquidacionCompraRepository = container.get<LiquidacionCompraRepository>(DI_TYPES.LiquidacionCompraRepository);
    const liquidacionCompra = await liquidacionCompraRepository.getByCompraId(compraId!, empresaId);
    expect(liquidacionCompra).toMatchObject({ numeroComprobante: "S/D (tropa 5024-CLA)" });
    expect(liquidacionCompra!.importeBruto).toBeCloseTo(27246 * 1723, 0);

    const liquidacionFaenaRepository = container.get<LiquidacionFaenaRepository>(DI_TYPES.LiquidacionFaenaRepository);
    const liquidacionFaena = await liquidacionFaenaRepository.getByCompraId(compraId!, empresaId);
    expect(liquidacionFaena).toMatchObject({ total: 2724000 });

    // Ningún asiento automático para ninguno de los tres eventos que normalmente lo disparan.
    const asientoRepository = container.get<AsientoRepository>(DI_TYPES.AsientoRepository);
    expect(await asientoRepository.getByOrigen(empresaId, "compra", compraId!)).toBeNull();
    expect(await asientoRepository.getByOrigen(empresaId, "liquidacion_compra", liquidacionCompra!.id)).toBeNull();
    expect(await asientoRepository.getByOrigen(empresaId, "liquidacion_faena", liquidacionFaena!.id)).toBeNull();
  });

  it("reusa el proveedor/frigorífico existente cuando la previsualización ya los resolvió por id", async () => {
    const confirmarImportacionCompras = container.get<ConfirmarImportacionCompras>(DI_TYPES.ConfirmarImportacionCompras);
    const proveedorRepository = container.get<ProveedorRepository>(DI_TYPES.ProveedorRepository);
    const frigorificoRepository = container.get<FrigorificoRepository>(DI_TYPES.FrigorificoRepository);

    const proveedorExistente = await proveedorRepository.list(empresaId).then((ps) => ps[0]!);
    const frigorificoExistente = await frigorificoRepository.list(empresaId).then((fs) => fs[0]!);

    const compraAImportar: CompraAImportar = {
      fila: 4,
      numero: "5025-CLA",
      proveedorNombre: proveedorExistente.razonSocial!,
      proveedorId: proveedorExistente.id,
      frigorificoNombre: frigorificoExistente.nombre,
      frigorificoId: frigorificoExistente.id,
      fecha: "2025-01-16",
      fechaFaena: "2025-01-18",
      dte: "028549511-3",
      remito: "001-5974",
      precioCompraKg: 1723,
      pesoBruto: 26680,
      pesoNeto: 25880,
      porcentajeDesbaste: 3,
      categorias: [{ categoria: CategoriaPorcino.CAPON, cabezas: 230 }],
      kgVivoTotalFaena: 25880,
      kgCarneTotalFaena: 20462.1,
      numeroComprobanteLiquidacion: "S/D (tropa 5025-CLA)",
      porcentajeIvaLiquidacion: 10.5,
      montoFaenaTotal: 2760000,
      rentabilidadReferenciaExcel: null,
    };

    const cantidadProveedoresAntes = (await proveedorRepository.list(empresaId)).length;
    const cantidadFrigorificosAntes = (await frigorificoRepository.list(empresaId)).length;

    const resultado = await confirmarImportacionCompras.execute({ empresaId, compras: [compraAImportar] });

    expect(resultado.creadas).toBe(1);
    expect(await proveedorRepository.list(empresaId)).toHaveLength(cantidadProveedoresAntes);
    expect(await frigorificoRepository.list(empresaId)).toHaveLength(cantidadFrigorificosAntes);

    const compraRepository = container.get<CompraRepository>(DI_TYPES.CompraRepository);
    const compra = await compraRepository.getById(resultado.detalle[0]!.compraId!, empresaId);
    expect(compra!.proveedorId).toBe(proveedorExistente.id);
    // Sin rentabilidad de referencia en el Excel -> sin comentarios.
    expect(compra!.comentarios).toBeNull();
  });
});
