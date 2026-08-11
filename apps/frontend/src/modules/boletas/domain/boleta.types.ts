/**
 * Espejo de `apps/backend/src/modules/boletas/domain/*`.
 */

import type { Venta } from "@/modules/ventas/domain/venta.types";

export interface Boleta {
  id: string;
  empresaId: string;
  clienteId: string;
  fecha: string;
  numero: string | null;
  comentarios: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `GET /boletas/:id` devuelve la boleta con sus ítems (ventas) — ver ese endpoint en el backend. */
export interface BoletaConVentas extends Boleta {
  ventas: Venta[];
}
