import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { Proveedor } from "@/modules/proveedores/domain/proveedor";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import {
  CategoriaCompraAImportar,
  CompraAImportar,
  FilaImportarCompraConError,
  PreviewImportacionCompras,
} from "@/modules/compras/domain/importacion-compras";
import {
  CategoriaAnimalPlanilla,
  FilaPlanillaCompra,
  PlanillaCompras,
  parsearComposicionAnimal,
} from "@/modules/compras/infra/import/planilla-compras.util";
import { CeldaCruda, celdaATexto, parsearFechaExcel } from "@/modules/contabilidad/infra/import/excel-reader.util";

export interface PrevisualizarImportacionComprasInput {
  empresaId: string;
  buffer: Buffer;
}

/** Insensible a mayúsculas/tildes/espacios extra — mismo criterio que los otros importadores históricos. */
function normalizarNombre(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** `null` cuando la celda está vacía/no es numérica — a diferencia de `numeroDeCelda` (boletas/cobros), acá SÍ importa distinguir "vacío" de "cero" para saber qué columnas faltan. */
function celdaNumericaONull(valor: CeldaCruda): number | null {
  const texto = celdaATexto(valor).replace(",", ".");
  if (texto === "") return null;
  const numero = Number(texto);
  return isFinite(numero) ? numero : null;
}

function nombreProveedor(p: Proveedor): string {
  return p.razonSocial ?? [p.nombre, p.apellido].filter(Boolean).join(" ");
}

const CATEGORIA_PLANILLA_A_DOMINIO: Record<CategoriaAnimalPlanilla, CategoriaPorcino> = {
  CAPON: CategoriaPorcino.CAPON,
  MEI: CategoriaPorcino.MACHOS_ENTEROS_INMUNOCASTRADOS,
  CHANCHA: CategoriaPorcino.CERDA_CHANCHA,
};

/** IVA implícito en $/kg SIN IVA vs. CON IVA cuando la planilla no trae ambos — 10.5% es la alícuota reducida real de AFIP para carne, y es el valor que da la planilla en el 100% de las filas donde sí trae los dos precios. */
const PORCENTAJE_IVA_DEFAULT = 10.5;

/** Tolerancia entre cabezas parseadas de "Animal" y "Cant. de anim. Cargados" — más de esto es señal de un error de tipeo real en el Excel (ver plan de carga inicial), no una diferencia normal de redondeo. */
function toleranciaCabezas(cargados: number): number {
  return Math.max(2, 0.05 * cargados);
}

/**
 * Primer paso del importador histórico de compras/tropas: lee
 * `COMPRAS PARA JUAN.xlsx` (una sola hoja, `PlanillaCompras`) y arma, por
 * fila, el detalle completo para crear compra + categorías + resultado de
 * faena + liquidación de compra + liquidación de faena — todo con los datos
 * que la planilla ya trae calculados (ver `domain/importacion-compras.ts`
 * para qué representa cada campo). No escribe nada en la base.
 *
 * Una fila es TODO o NADA: si falta algún dato imprescindible para armar el
 * detalle completo (proveedor, fechas, pesos, precio, kg rendidos, gasto de
 * faena, composición de animales), la fila entera queda en `conError` — no
 * se arman documentos parciales (ver decisión en el plan de carga inicial:
 * "Rentabilidad histórica").
 */
@injectable()
export class PrevisualizarImportacionCompras {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
  ) {}

  async execute(input: PrevisualizarImportacionComprasInput): Promise<PreviewImportacionCompras> {
    const planilla = PlanillaCompras.desdeBuffer(input.buffer);
    const filas = planilla.listarFilas();

    const [proveedores, frigorificos] = await Promise.all([
      this.proveedorRepository.list(input.empresaId),
      this.frigorificoRepository.list(input.empresaId),
    ]);
    const proveedoresPorNombre = new Map(proveedores.map((p) => [normalizarNombre(nombreProveedor(p)), p.id]));
    const frigorificosPorNombre = new Map(frigorificos.map((f) => [normalizarNombre(f.nombre), f.id]));

    const comprasACrear: CompraAImportar[] = [];
    const conError: FilaImportarCompraConError[] = [];
    const proveedoresNuevos = new Set<string>();
    const frigorificosNuevos = new Set<string>();

    for (const fila of filas) {
      const { compra, errores } = this.procesarFila(fila);

      if (errores.length > 0) {
        conError.push({ fila: fila.numero, numeroTropa: celdaATexto(fila.numeroTropa) || null, errores });
        continue;
      }

      const compraOk = compra!;
      const proveedorId = proveedoresPorNombre.get(normalizarNombre(compraOk.proveedorNombre)) ?? null;
      if (!proveedorId) proveedoresNuevos.add(compraOk.proveedorNombre);
      compraOk.proveedorId = proveedorId;

      if (compraOk.frigorificoNombre) {
        const frigorificoId = frigorificosPorNombre.get(normalizarNombre(compraOk.frigorificoNombre)) ?? null;
        if (!frigorificoId) frigorificosNuevos.add(compraOk.frigorificoNombre);
        compraOk.frigorificoId = frigorificoId;
      }

      comprasACrear.push(compraOk);
    }

    return {
      filasProcesadas: filas.length,
      comprasACrear: comprasACrear.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.fila - b.fila),
      proveedoresNuevos: [...proveedoresNuevos].sort(),
      frigorificosNuevos: [...frigorificosNuevos].sort(),
      conError,
    };
  }

  private procesarFila(fila: FilaPlanillaCompra): { compra: CompraAImportar | null; errores: string[] } {
    const errores: string[] = [];

    const numero = celdaATexto(fila.numeroTropa);
    if (!numero) errores.push("sin número de tropa");

    const proveedorNombre = celdaATexto(fila.lugarCarga);
    if (!proveedorNombre) errores.push("sin proveedor (lugar de carga)");

    const fecha = parsearFechaExcel(fila.fechaCarga);
    if (!fecha) errores.push(`no se pudo interpretar la fecha de carga "${celdaATexto(fila.fechaCarga)}"`);

    const fechaFaena = parsearFechaExcel(fila.fechaFaena);
    if (!fechaFaena) errores.push(`no se pudo interpretar la fecha de faena "${celdaATexto(fila.fechaFaena)}"`);

    const precioCompraKg = celdaNumericaONull(fila.precioKgSinIva);
    if (precioCompraKg === null) errores.push("sin precio $/kg sin IVA");

    const pesoBruto = celdaNumericaONull(fila.kgBrutoJaula);
    if (pesoBruto === null) errores.push("sin kg bruto de jaula");

    const pesoNeto = celdaNumericaONull(fila.kgNetoJaula);
    if (pesoNeto === null) errores.push("sin kg neto de jaula");

    const kgCarneTotalFaena = celdaNumericaONull(fila.kgRendidos);
    if (kgCarneTotalFaena === null) errores.push("sin kg rendidos");

    const montoFaenaTotal = celdaNumericaONull(fila.gastoFaena);
    if (montoFaenaTotal === null) errores.push('sin gasto de faena (columna "Faena")');

    const categorias = this.resolverCategorias(fila, errores);

    if (errores.length > 0) return { compra: null, errores };

    // A partir de acá, todos los campos obligatorios están presentes (TypeScript no lo sabe solo).
    const porcentajeDesbaste = pesoBruto! > 0 ? Math.round((1 - pesoNeto! / pesoBruto!) * 10000) / 100 : 0;

    const precioKgConIva = celdaNumericaONull(fila.precioKgConIva);
    const porcentajeIvaLiquidacion =
      precioKgConIva !== null && precioCompraKg! > 0
        ? Math.round((precioKgConIva / precioCompraKg! - 1) * 10000) / 100
        : PORCENTAJE_IVA_DEFAULT;

    const dte = celdaATexto(fila.dte) || "S/D";
    const remito = celdaATexto(fila.remitoCriadero) || "S/D";
    const numeroComprobanteLiquidacion = celdaATexto(fila.liqDeCompra) || `S/D (tropa ${numero})`;
    const frigorificoNombre = celdaATexto(fila.lugarFaena) || null;

    const compra: CompraAImportar = {
      fila: fila.numero,
      numero,
      proveedorNombre,
      proveedorId: null, // se completa en `execute`, ahí es donde conocemos el catálogo existente
      frigorificoNombre,
      frigorificoId: null,
      fecha: fecha!.toISOString().slice(0, 10),
      fechaFaena: fechaFaena!.toISOString().slice(0, 10),
      dte,
      remito,
      precioCompraKg: precioCompraKg!,
      pesoBruto: pesoBruto!,
      pesoNeto: pesoNeto!,
      porcentajeDesbaste,
      categorias: categorias!,
      kgVivoTotalFaena: pesoNeto!,
      kgCarneTotalFaena: kgCarneTotalFaena!,
      numeroComprobanteLiquidacion,
      porcentajeIvaLiquidacion,
      montoFaenaTotal: montoFaenaTotal!,
      rentabilidadReferenciaExcel: this.armarRentabilidadReferencia(fila),
    };

    return { compra, errores: [] };
  }

  /** Devuelve `null` (y agrega a `errores`) si la composición no se puede resolver con confianza — nunca adivina. */
  private resolverCategorias(fila: FilaPlanillaCompra, errores: string[]): CategoriaCompraAImportar[] | null {
    const textoAnimal = celdaATexto(fila.animal);
    if (!textoAnimal) {
      errores.push("sin composición de animales (columna Animal)");
      return null;
    }

    const composicion = parsearComposicionAnimal(textoAnimal);
    if (!composicion) {
      errores.push(`composición de animales no reconocida: "${textoAnimal}"`);
      return null;
    }

    const cargados = celdaNumericaONull(fila.cantCargados);

    let piezas = composicion;
    if (piezas.length === 1 && piezas[0]!.cabezas === null) {
      if (cargados === null) {
        errores.push(`"${textoAnimal}" no trae cantidad y tampoco hay "Cant. de anim. Cargados" para usar de referencia`);
        return null;
      }
      piezas = [{ categoria: piezas[0]!.categoria, cabezas: cargados }];
    }

    if (piezas.some((p) => p.cabezas === null)) {
      errores.push(`composición ambigua, falta cantidad para alguna categoría: "${textoAnimal}"`);
      return null;
    }

    const total = piezas.reduce((acc, p) => acc + p.cabezas!, 0);
    if (cargados !== null && Math.abs(total - cargados) > toleranciaCabezas(cargados)) {
      errores.push(`las cabezas de "${textoAnimal}" (${total}) no coinciden con "Cant. de anim. Cargados" (${cargados})`);
      return null;
    }

    // Suma líneas repetidas de la misma categoría (no se vio en los datos reales, pero es una garantía barata).
    const cabezasPorCategoria = new Map<CategoriaPorcino, number>();
    for (const pieza of piezas) {
      const categoriaDominio = CATEGORIA_PLANILLA_A_DOMINIO[pieza.categoria];
      cabezasPorCategoria.set(categoriaDominio, (cabezasPorCategoria.get(categoriaDominio) ?? 0) + pieza.cabezas!);
    }
    return [...cabezasPorCategoria.entries()].map(([categoria, cabezas]) => ({ categoria, cabezas }));
  }

  private armarRentabilidadReferencia(fila: FilaPlanillaCompra): string | null {
    const ganancia = celdaNumericaONull(fila.gananciaReferencia);
    const rentabilidad = celdaNumericaONull(fila.rentabilidadReferencia);
    if (ganancia === null && rentabilidad === null) return null;

    const gananciaTexto = ganancia !== null ? `$${ganancia.toFixed(2)}` : "S/D";
    const rentabilidadTexto = rentabilidad !== null ? `${(rentabilidad * 100).toFixed(2)}%` : "S/D";
    return (
      `Datos de referencia del Excel original (no recalculados por el sistema): ` +
      `ganancia ${gananciaTexto} · rentabilidad bruta facturada ${rentabilidadTexto}`
    );
  }
}
