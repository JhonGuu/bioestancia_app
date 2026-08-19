import { Venta } from "@/modules/ventas/domain/venta";
import { CategoriaVenta } from "@/modules/ventas/domain/categoria-venta";
import { FormaVenta } from "@/modules/ventas/domain/forma-venta";

export interface DetalleCategoriaVenta {
  categoria: CategoriaVenta;
  /** Cabeza entera = 1, media res = 0.5, pulpa = 0 (es un corte, no una cabeza) — mismo criterio que `contarCabezas` en `boleta-form.tsx`. */
  cabezas: number;
  kg: number;
  monto: number;
}

function cabezasDeVenta(venta: Venta): number {
  if (venta.formaVenta === FormaVenta.CABEZA) return 1;
  if (venta.formaVenta === FormaVenta.MEDIA_RES) return 0.5;
  return 0;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Agrupa las ventas de UNA boleta por categoría del animal (Capón, MEI,
 * Cachorra, Chancha, etc.) — cada categoría queda siempre separada (nunca se
 * suman entre sí, ej. Chancha nunca se mezcla con Capón), con el total de
 * cabezas, kg y monto de esa categoría. Ignora ventas sin categoría
 * (`compensacion_kg`, que es un ajuste, no una venta de animal).
 *
 * Se usa en `ObtenerMovimientosCuentaCorriente` para mostrar el detalle de
 * cada boleta en el resumen de cuenta, en vez de solo el monto total.
 */
export function agruparVentasPorCategoria(ventasDeLaBoleta: Venta[]): DetalleCategoriaVenta[] {
  const porCategoria = new Map<CategoriaVenta, DetalleCategoriaVenta>();

  for (const venta of ventasDeLaBoleta) {
    if (!venta.categoria) continue;
    const actual = porCategoria.get(venta.categoria) ?? {
      categoria: venta.categoria,
      cabezas: 0,
      kg: 0,
      monto: 0,
    };
    actual.cabezas += cabezasDeVenta(venta);
    actual.kg += venta.kg;
    actual.monto += venta.total ?? 0;
    porCategoria.set(venta.categoria, actual);
  }

  return [...porCategoria.values()].map((d) => ({
    ...d,
    cabezas: redondear(d.cabezas),
    kg: redondear(d.kg),
    monto: redondear(d.monto),
  }));
}
