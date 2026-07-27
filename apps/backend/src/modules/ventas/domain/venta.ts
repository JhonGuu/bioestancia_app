import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

/**
 * Representación de la Venta en el dominio.
 *
 * Cada fila es UNA venta de un garrón (cabeza entera, media res, o un corte
 * como pulpa) — no un lote. `compraId`/`garron` son nullable porque las filas
 * de `compensación de kg` (ajustes) no tienen animal físico asociado.
 *
 * Un mismo `garron` (junto con su `compraId`) puede aparecer en MÁS de una
 * venta: cada garrón tiene 2 medias reses, y se pueden vender por separado a
 * dos clientes distintos. No hay unicidad de `garron` a nivel fila — la
 * reconciliación de cabezas vendidas para el cierre de una compra cuenta
 * garrones DISTINTOS, no filas (ver `modules/compras/use-cases/cerrar-compra.use-case.ts`).
 *
 * `boletaId` es nullable por compatibilidad con datos previos a que existiera
 * el módulo `boletas`, pero toda venta nueva debería cargarse con su boleta.
 *
 * `clienteFinalReferencia` es un dato libre, no una relación: cubre el caso de
 * clientes que revenden (ej. "Ivan") — ahí se anota a quién le vendió Ivan,
 * solo como referencia para la boleta, sin crear un cliente ni una venta nueva.
 */
export interface Venta {
  id: string;
  empresaId: string;
  clienteId: string;
  boletaId: string | null;
  compraId: string | null;
  garron: number | null;
  formaVenta: FormaVenta;
  kg: number;
  precioKg: number;
  total: number;
  fecha: Date;
  clienteFinalReferencia: string | null;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
