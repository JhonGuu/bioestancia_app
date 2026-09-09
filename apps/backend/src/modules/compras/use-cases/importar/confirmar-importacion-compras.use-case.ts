import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { Logger } from "@/shared/infra/logger/logger";
import { CondicionFiscal } from "@/modules/clientes/domain/condicion-fiscal";
import { ProveedorRepository } from "@/modules/proveedores/domain/proveedor.repository";
import { FrigorificoRepository } from "@/modules/frigorificos/domain/frigorifico.repository";
import { CompraRepository } from "@/modules/compras/domain/compra.repository";
import { CompraCategoriaRepository } from "@/modules/compras/domain/compra-categoria.repository";
import { EspecieAnimal } from "@/modules/compras/domain/especie-animal";
import { ResultadoFaenaRepository } from "@/modules/resultado-faena/domain/resultado-faena.repository";
import { LiquidacionCompraRepository } from "@/modules/liquidacion-compra/domain/liquidacion-compra.repository";
import { LiquidacionFaenaRepository } from "@/modules/liquidacion-faena/domain/liquidacion-faena.repository";
import { CompraAImportar, ResultadoImportacionCompraItem, ResultadoImportacionCompras } from "@/modules/compras/domain/importacion-compras";

export interface ConfirmarImportacionComprasInput {
  empresaId: string;
  compras: CompraAImportar[];
}

/** Mismo criterio que los otros importadores históricos (normaliza para no crear el mismo proveedor/frigorífico dos veces por variaciones de mayúsculas/espacios). */
function normalizarNombre(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Reparte `total` entre `pesos` (paralelo por índice) proporcionalmente,
 * ajustando el ÚLTIMO elemento para que la suma dé EXACTO — evita que el
 * redondeo de cada línea deje un resto sin asignar en ninguna.
 */
function repartirProporcional(total: number, pesos: number[]): number[] {
  const sumaPesos = pesos.reduce((acc, p) => acc + p, 0);
  if (sumaPesos <= 0) return pesos.map(() => 0);

  const resultado: number[] = [];
  let acumulado = 0;
  for (let i = 0; i < pesos.length; i++) {
    if (i === pesos.length - 1) {
      resultado.push(Math.round((total - acumulado) * 100) / 100);
    } else {
      const parte = Math.round(total * (pesos[i]! / sumaPesos) * 100) / 100;
      resultado.push(parte);
      acumulado += parte;
    }
  }
  return resultado;
}

/**
 * Segundo paso del importador histórico de compras/tropas: crea, para cada
 * fila que pasó la previsualización, la cadena completa de documentos —
 * `Compra` + `CompraCategoria` + `ResultadoFaena` + `LiquidacionCompra` +
 * `LiquidacionFaena` — construyendo DIRECTO sobre los repositorios (no
 * `CreateCompra`/`CreateLiquidacionCompra`/`CreateLiquidacionFaena`, que
 * disparan `GenerarAsientosAutomaticos`) — mismo criterio anti-duplicación
 * que boletas/cobros (ver plan de carga inicial). `CreateResultadoFaena`
 * tampoco dispara asiento, pero se construye igual directo sobre el
 * repositorio por consistencia con el resto de la cadena.
 *
 * Cada tropa se procesa de forma aislada: si falla en cualquier paso de la
 * cadena, las demás siguen — el resultado dice cuál falló y en qué paso.
 */
@injectable()
export class ConfirmarImportacionCompras {
  constructor(
    @inject(DI_TYPES.ProveedorRepository) private readonly proveedorRepository: ProveedorRepository,
    @inject(DI_TYPES.FrigorificoRepository) private readonly frigorificoRepository: FrigorificoRepository,
    @inject(DI_TYPES.CompraRepository) private readonly compraRepository: CompraRepository,
    @inject(DI_TYPES.CompraCategoriaRepository) private readonly compraCategoriaRepository: CompraCategoriaRepository,
    @inject(DI_TYPES.ResultadoFaenaRepository) private readonly resultadoFaenaRepository: ResultadoFaenaRepository,
    @inject(DI_TYPES.LiquidacionCompraRepository) private readonly liquidacionCompraRepository: LiquidacionCompraRepository,
    @inject(DI_TYPES.LiquidacionFaenaRepository) private readonly liquidacionFaenaRepository: LiquidacionFaenaRepository,
    @inject(DI_TYPES.Logger) private readonly logger: Logger,
  ) {}

  async execute(input: ConfirmarImportacionComprasInput): Promise<ResultadoImportacionCompras> {
    const proveedorIdPorNombre = new Map<string, string>();
    const frigorificoIdPorNombre = new Map<string, string>();

    let creadas = 0;
    let fallidas = 0;
    const detalle: ResultadoImportacionCompraItem[] = [];

    for (const compra of input.compras) {
      try {
        const compraId = await this.crearCompraCompleta(input.empresaId, compra, proveedorIdPorNombre, frigorificoIdPorNombre);
        creadas++;
        detalle.push({ fila: compra.fila, numero: compra.numero, ok: true, compraId });
      } catch (err) {
        fallidas++;
        const mensaje = err instanceof Error ? err.message : "Error desconocido";
        this.logger.warn(`Importación de compras — fila ${compra.fila} (tropa ${compra.numero}): ${mensaje}`);
        detalle.push({ fila: compra.fila, numero: compra.numero, ok: false, error: mensaje });
      }
    }

    return { creadas, fallidas, detalle };
  }

  private async crearCompraCompleta(
    empresaId: string,
    compraAImportar: CompraAImportar,
    proveedorIdPorNombre: Map<string, string>,
    frigorificoIdPorNombre: Map<string, string>,
  ): Promise<string> {
    const proveedorId = await this.resolverOCrearProveedor(empresaId, compraAImportar, proveedorIdPorNombre);
    const frigorificoId = compraAImportar.frigorificoNombre
      ? await this.resolverOCrearFrigorifico(empresaId, compraAImportar, frigorificoIdPorNombre)
      : undefined;

    const compra = await this.compraRepository.create({
      empresaId,
      proveedorId,
      numero: compraAImportar.numero,
      especie: EspecieAnimal.PORCINO,
      fecha: new Date(`${compraAImportar.fecha}T00:00:00.000Z`),
      dte: compraAImportar.dte,
      remito: compraAImportar.remito,
      precioCompraKg: compraAImportar.precioCompraKg,
      porcentajeDesbaste: compraAImportar.porcentajeDesbaste,
      pesoBruto: compraAImportar.pesoBruto,
      pesoNeto: compraAImportar.pesoNeto,
      comentarios: compraAImportar.rentabilidadReferenciaExcel ?? undefined,
    });

    const lineas = await this.compraCategoriaRepository.createMany(
      compraAImportar.categorias.map((c) => ({ compraId: compra.id, categoria: c.categoria, cabezas: c.cabezas })),
    );
    const cabezasPorLinea = lineas.map((l) => l.cabezas);

    // --- Resultado de faena: reparte kg vivo/carne totales por cabeza (la planilla no lo discrimina por categoría). ---
    const kgVivoPorLinea = repartirProporcional(compraAImportar.kgVivoTotalFaena, cabezasPorLinea);
    const kgCarnePorLinea = repartirProporcional(compraAImportar.kgCarneTotalFaena, cabezasPorLinea);
    for (let i = 0; i < lineas.length; i++) {
      await this.compraCategoriaRepository.actualizarFaena(lineas[i]!.id, {
        kgVivoFaena: kgVivoPorLinea[i]!,
        kgCarne: kgCarnePorLinea[i]!,
        porcentajeMagro: null,
        destinoComercial: null,
        cuartosDelantero: null,
        cuartosTrasero: null,
        comisosCabezas: 0,
        comisosKg: 0,
      });
    }
    const fechaFaena = new Date(`${compraAImportar.fechaFaena}T00:00:00.000Z`);
    const rendimiento =
      compraAImportar.kgVivoTotalFaena > 0
        ? Math.round((compraAImportar.kgCarneTotalFaena / compraAImportar.kgVivoTotalFaena) * 100 * 100) / 100
        : 0;
    await this.resultadoFaenaRepository.create({
      empresaId,
      compraId: compra.id,
      frigorificoId,
      fechaFaena,
      kgVivoTotal: compraAImportar.kgVivoTotalFaena,
      kgCarneTotal: compraAImportar.kgCarneTotalFaena,
      comisosKg: 0,
      comisosCabezas: 0,
      rendimiento,
    });

    // --- Liquidación de compra: se factura sobre el kg vivo de faena de cada línea, mismo $/kg y % IVA para toda la tropa. ---
    let importeBrutoTotal = 0;
    let ivaSobreBrutoTotal = 0;
    for (let i = 0; i < lineas.length; i++) {
      const importeBruto = Math.round(kgVivoPorLinea[i]! * compraAImportar.precioCompraKg * 100) / 100;
      const importeIva = Math.round((importeBruto * compraAImportar.porcentajeIvaLiquidacion) / 100 * 100) / 100;
      importeBrutoTotal += importeBruto;
      ivaSobreBrutoTotal += importeIva;
      await this.compraCategoriaRepository.actualizarLiquidacion(lineas[i]!.id, {
        precioKg: compraAImportar.precioCompraKg,
        importeBruto,
        porcentajeIva: compraAImportar.porcentajeIvaLiquidacion,
        importeIva,
      });
    }
    importeBrutoTotal = Math.round(importeBrutoTotal * 100) / 100;
    ivaSobreBrutoTotal = Math.round(ivaSobreBrutoTotal * 100) / 100;
    await this.liquidacionCompraRepository.create({
      empresaId,
      compraId: compra.id,
      numeroComprobante: compraAImportar.numeroComprobanteLiquidacion,
      fecha: fechaFaena,
      importeBruto: importeBrutoTotal,
      ivaSobreBruto: ivaSobreBrutoTotal,
      importeNeto: Math.round((importeBrutoTotal + ivaSobreBrutoTotal) * 100) / 100,
    });

    // --- Liquidación de faena: canon parejo por cabeza (la planilla trae un solo gasto de faena por tropa, no por categoría). ---
    const totalCabezas = cabezasPorLinea.reduce((acc, c) => acc + c, 0);
    const canonPorAnimal = totalCabezas > 0 ? Math.round((compraAImportar.montoFaenaTotal / totalCabezas) * 100) / 100 : 0;
    const canonPorLinea = repartirProporcional(compraAImportar.montoFaenaTotal, cabezasPorLinea);
    for (let i = 0; i < lineas.length; i++) {
      await this.compraCategoriaRepository.actualizarCanonFaena(lineas[i]!.id, {
        canonFaenaPorAnimal: canonPorAnimal,
        canonFaenaSubtotal: canonPorLinea[i]!,
      });
    }
    await this.liquidacionFaenaRepository.create({
      empresaId,
      compraId: compra.id,
      frigorificoId,
      fecha: fechaFaena,
      total: compraAImportar.montoFaenaTotal,
    });

    return compra.id;
  }

  /** Si la previsualización ya la matcheó contra un proveedor existente usa ese id; si no, cachea (`proveedorIdPorNombre`) para no crear el mismo proveedor dos veces dentro de la misma confirmación. */
  private async resolverOCrearProveedor(
    empresaId: string,
    compra: CompraAImportar,
    proveedorIdPorNombre: Map<string, string>,
  ): Promise<string> {
    if (compra.proveedorId) return compra.proveedorId;

    const clave = normalizarNombre(compra.proveedorNombre);
    const existente = proveedorIdPorNombre.get(clave);
    if (existente) return existente;

    // `condicionFiscal` es obligatorio en el dominio y la planilla no la trae — mismo default que usan
    // boletas/cobros para clientes nuevos (CONSUMIDOR_FINAL), a corregir a mano si corresponde.
    const nuevo = await this.proveedorRepository.create({
      empresaId,
      razonSocial: compra.proveedorNombre,
      condicionFiscal: CondicionFiscal.CONSUMIDOR_FINAL,
    });
    proveedorIdPorNombre.set(clave, nuevo.id);
    return nuevo.id;
  }

  /** Mismo criterio que `resolverOCrearProveedor`, para frigoríficos. */
  private async resolverOCrearFrigorifico(
    empresaId: string,
    compra: CompraAImportar,
    frigorificoIdPorNombre: Map<string, string>,
  ): Promise<string> {
    if (compra.frigorificoId) return compra.frigorificoId;

    const clave = normalizarNombre(compra.frigorificoNombre!);
    const existente = frigorificoIdPorNombre.get(clave);
    if (existente) return existente;

    const nuevo = await this.frigorificoRepository.create({ empresaId, nombre: compra.frigorificoNombre! });
    frigorificoIdPorNombre.set(clave, nuevo.id);
    return nuevo.id;
  }
}
