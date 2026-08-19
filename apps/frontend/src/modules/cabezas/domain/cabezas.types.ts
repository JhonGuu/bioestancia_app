/**
 * Espejo de `apps/backend/src/modules/cabezas/domain/informe-cabezas.ts`.
 */

/**
 * CAPON = todas las categorías porcinas salvo Chancha (Capón, MEI, Cachorra,
 * Cachorro, Padrillo, Lechones, ...) — el negocio las trata igual, la única
 * que importa diferenciar es CHANCHA (cerdas de descarte, otro precio).
 */
export type GrupoCabezas = "CAPON" | "CHANCHA";

/** Mismo orden que el backend — un bloque por grupo, en este orden. */
export const GRUPOS_CABEZAS: GrupoCabezas[] = ["CAPON", "CHANCHA"];

export interface LineaCabezasCliente {
  clienteId: string;
  clienteNombre: string;
  cantEstimada: number;
  cantReal: number;
  kg: number;
  montoTotal: number;
  precioPromedio: number | null;
}

export interface BloqueCabezasCategoria {
  grupo: GrupoCabezas;
  totalCabezas: number;
  totalKg: number;
  totalMonto: number;
  precioPromedio: number | null;
  precioMinimo: number | null;
  lineas: LineaCabezasCliente[];
}

export interface InformeCabezas {
  anio: number;
  semana: number;
  desde: string;
  hasta: string;
  bloques: BloqueCabezasCategoria[];
}

/** `anio`/`semana` opcionales — si no vienen, el backend usa la semana ISO actual. */
export interface FiltrosInformeCabezas {
  anio?: number;
  semana?: number;
}
