import { FormaVenta } from "@/modules/ventas/domain/forma-venta";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";

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
 * `clienteFinalId` referencia el catálogo de destinos del cliente revendedor
 * (`modules/clientes/domain/cliente-final.ts`, ej. "Ivan") — ahí se anota a
 * quién le vendió Ivan, solo como referencia para la boleta, sin crear un
 * cliente ni una venta nueva. Nullable: solo aplica a ventas de clientes
 * `esRevendedor`.
 *
 * `categoria` es la categoría del animal (Capón, Chancha, MEI, etc. — mismo
 * catálogo que `compras`), independiente de `formaVenta` (que ahora es solo
 * la presentación: cabeza entera, media res, pulpa). Nullable: una
 * `compensacion_kg` no tiene animal asociado. También puede ser una
 * categoría de reventa (`CategoriaReventa.NOVILLO`, ver
 * `domain/categoria-venta.ts`) — en ese caso `compraId` también es null: no
 * sale de ninguna tropa nuestra.
 *
 * `precioKg`/`total` son nullable: el operario que carga la boleta desde el
 * reparto solo conoce cliente/tropa/categoría/kg — el precio lo completa
 * después alguien de administración/contable
 * (`use-cases/set-precio-venta.use-case.ts`). Mientras `precioKg` sea null,
 * la venta está "pendiente de precio".
 */
export interface Venta {
  id: string;
  empresaId: string;
  clienteId: string;
  boletaId: string | null;
  compraId: string | null;
  garron: number | null;
  formaVenta: FormaVenta;
  categoria: CategoriaVenta | null;
  kg: number;
  precioKg: number | null;
  total: number | null;
  fecha: Date;
  clienteFinalId: string | null;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
