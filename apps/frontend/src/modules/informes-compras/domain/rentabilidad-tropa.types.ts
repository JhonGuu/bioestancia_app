/**
 * Espejo de `apps/backend/src/modules/informes-compras/domain/rentabilidad-tropa.ts`.
 * Costo (liquidación de compra al proveedor + liquidación de faena al
 * frigorífico) vs. ingreso de venta de la carne, por tropa.
 */
export interface RentabilidadTropa {
  compraId: string;
  numero: string;
  letra: string | null;
  fecha: string;
  proveedorId: string;
  cerrada: boolean;
  costoCompra: number | null;
  costoFaena: number | null;
  costoTotal: number | null;
  ingresoVenta: number;
  ganancia: number | null;
  rentabilidadPorcentaje: number | null;
}
