import { inject, injectable } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { ClienteRepository } from "@/modules/clientes/domain/cliente.repository";
import { Cliente, nombreCliente } from "@/modules/clientes/domain/cliente";
import { VentaRepository } from "@/modules/ventas/domain/venta.repository";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaPorcino } from "@/modules/compras/domain/categoria-porcino";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
import { PlanificacionCabezasRepository } from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.repository";
import { rangoSemanaIso } from "@/shared/domain/semana-iso";
import {
  BloqueCabezasCategoria,
  GRUPOS_CABEZAS,
  GrupoCabezas,
  InformeCabezas,
  LineaCabezasCliente,
} from "@/modules/cabezas/domain/informe-cabezas";

export interface ObtenerInformeCabezasInput {
  empresaId: string;
  anio: number;
  semana: number;
}

interface AcumuladorCliente {
  cantReal: number;
  kg: number;
  montoTotal: number;
}

/**
 * Arma la vista "Cabezas": para una semana ISO puntual, un bloque por cada
 * grupo de `GRUPOS_CABEZAS` (CAPON = todo menos Chancha, CHANCHA = solo
 * Cerda/Chancha — ver `grupoDeCategoria`) con la planificación (estimado) y
 * lo realmente vendido (real, kg, $ total, precio ponderado) de cada cliente,
 * cruzando `ventas` + `planificacion_cabezas` en tiempo de lectura — no tiene
 * tabla ni estado propio, mismo espíritu que `ObtenerInformeCobranzas`.
 */
@injectable()
export class ObtenerInformeCabezas {
  constructor(
    @inject(DI_TYPES.ClienteRepository) private readonly clienteRepository: ClienteRepository,
    @inject(DI_TYPES.VentaRepository) private readonly ventaRepository: VentaRepository,
    @inject(DI_TYPES.PlanificacionCabezasRepository)
    private readonly planificacionCabezasRepository: PlanificacionCabezasRepository,
  ) {}

  async execute(input: ObtenerInformeCabezasInput): Promise<InformeCabezas> {
    const { desde, hasta } = rangoSemanaIso({ anio: input.anio, semana: input.semana });
    // `rangoSemanaIso` da `hasta` EXCLUSIVE (el lunes siguiente) — acá se
    // resta 1ms para mostrar el domingo como último día inclusive, más claro
    // en pantalla. Las consultas de abajo usan `desde`/`hasta` tal cual
    // (exclusive), coherente con lo que esperan los repositorios.
    const hastaInclusive = new Date(hasta.getTime() - 1);

    const [clientes, ventas, planes] = await Promise.all([
      this.clienteRepository.list(input.empresaId),
      this.ventaRepository.listByEmpresaYRango(input.empresaId, desde, hasta),
      this.planificacionCabezasRepository.listByRango({ empresaId: input.empresaId, desde, hasta }),
    ]);

    const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

    // Estimado: NO distingue categoría (ver comentario de `LineaCabezasCliente`
    // en el dominio) — un único total por cliente para toda la semana, sumando
    // los días cargados en `planificacion_cabezas`.
    const cantEstimadaPorCliente = new Map<string, number>();
    for (const plan of planes) {
      cantEstimadaPorCliente.set(
        plan.clienteId,
        (cantEstimadaPorCliente.get(plan.clienteId) ?? 0) + plan.cabezasPlanificadas,
      );
    }

    const bloques: BloqueCabezasCategoria[] = GRUPOS_CABEZAS.map((grupo) =>
      this.armarBloque(grupo, ventas, clientesPorId, cantEstimadaPorCliente),
    );

    return { anio: input.anio, semana: input.semana, desde, hasta: hastaInclusive, bloques };
  }

  /**
   * A qué grupo pertenece una venta: CHANCHA si es `CategoriaPorcino.CERDA_CHANCHA`,
   * CAPON para cualquier otra categoría porcina (Capón, MEI, Cachorra, Cachorro,
   * Padrillo, Lechones, ...) — el negocio las trata todas igual, ver comentario
   * de `GrupoCabezas` en el dominio. Categorías de reventa (`CategoriaReventa`,
   * ej. Novillo bovino) no pertenecen a ningún grupo: no son cabezas propias.
   */
  private grupoDeCategoria(categoria: CategoriaVenta | null): GrupoCabezas | null {
    if (categoria === null) return null;
    if (!Object.values(CategoriaPorcino).includes(categoria as CategoriaPorcino)) return null;
    return categoria === CategoriaPorcino.CERDA_CHANCHA ? "CHANCHA" : "CAPON";
  }

  private armarBloque(
    grupo: GrupoCabezas,
    ventas: Awaited<ReturnType<VentaRepository["listByEmpresaYRango"]>>,
    clientesPorId: Map<string, Cliente>,
    cantEstimadaPorCliente: Map<string, number>,
  ): BloqueCabezasCategoria {
    // Solo "cabeza" (animal entero, cuenta 1) y "media_res" (medio animal,
    // cuenta 0.5) — mismo criterio que la planilla Excel ("cabeza capón" +
    // "1/2 res capón"/2). `pulpa` y `compensacion_kg` no representan cabezas.
    const ventasDelGrupo = ventas.filter(
      (v) =>
        this.grupoDeCategoria(v.categoria) === grupo &&
        (v.formaVenta === FormaVenta.CABEZA || v.formaVenta === FormaVenta.MEDIA_RES),
    );

    const acumuladoPorCliente = new Map<string, AcumuladorCliente>();
    for (const venta of ventasDelGrupo) {
      if (!acumuladoPorCliente.has(venta.clienteId)) {
        acumuladoPorCliente.set(venta.clienteId, { cantReal: 0, kg: 0, montoTotal: 0 });
      }
      const acumulado = acumuladoPorCliente.get(venta.clienteId);
      if (!acumulado) continue;
      acumulado.cantReal += venta.formaVenta === FormaVenta.CABEZA ? 1 : 0.5;
      acumulado.kg += venta.kg;
      acumulado.montoTotal += venta.total ?? 0;
    }

    // Universo de clientes a mostrar: los que tienen estimado O real > 0 en
    // esta categoría/semana — un cliente sin ninguno de los dos no aporta
    // nada a la vista.
    const clienteIds = new Set<string>([...acumuladoPorCliente.keys(), ...cantEstimadaPorCliente.keys()]);

    const lineas: LineaCabezasCliente[] = [];
    for (const clienteId of clienteIds) {
      const cliente = clientesPorId.get(clienteId);
      const acumulado = acumuladoPorCliente.get(clienteId);
      const cantEstimada = cantEstimadaPorCliente.get(clienteId) ?? 0;
      const cantReal = acumulado?.cantReal ?? 0;
      if (!cliente || (cantEstimada === 0 && cantReal === 0)) continue;

      const kg = acumulado?.kg ?? 0;
      const montoTotal = acumulado?.montoTotal ?? 0;
      lineas.push({
        clienteId,
        clienteNombre: nombreCliente(cliente),
        cantEstimada,
        cantReal,
        kg,
        montoTotal,
        precioPromedio: kg > 0 ? montoTotal / kg : null,
      });
    }
    lineas.sort((a, b) => a.clienteNombre.localeCompare(b.clienteNombre, "es"));

    const totalCabezas = lineas.reduce((acc, l) => acc + l.cantReal, 0);
    const totalKg = lineas.reduce((acc, l) => acc + l.kg, 0);
    const totalMonto = lineas.reduce((acc, l) => acc + l.montoTotal, 0);
    const preciosDeLineas = lineas
      .map((l) => l.precioPromedio)
      .filter((p): p is number => p !== null);

    return {
      grupo,
      totalCabezas,
      totalKg,
      totalMonto,
      precioPromedio: totalKg > 0 ? totalMonto / totalKg : null,
      precioMinimo: preciosDeLineas.length > 0 ? Math.min(...preciosDeLineas) : null,
      lineas,
    };
  }
}
