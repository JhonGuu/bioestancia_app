/**
 * Espejo de `apps/backend/src/modules/informe-cobranzas/domain/informe-cobranzas.ts`.
 */
import type { MedioPago } from "@/modules/cobros/domain/cobro.types";

export interface LineaInformeCobranza {
  cobroId: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  medioPago: MedioPago;
  monto: number;
  numeroCheque: string | null;
  bancoCheque: string | null;
  bancoOBilletera: string | null;
  remitente: string | null;
  comentarios: string | null;
}

export interface TotalPorMedioPago {
  medioPago: MedioPago;
  cantidad: number;
  total: number;
}

export interface InformeCobranzas {
  desde: string | null;
  hasta: string | null;
  medioPagoFiltrado: MedioPago | null;
  lineas: LineaInformeCobranza[];
  totalesPorMedioPago: TotalPorMedioPago[];
  totalGeneral: number;
  generadoEn: string;
}

/** `desde`/`hasta`: "YYYY-MM-DD". */
export interface FiltrosInformeCobranzas {
  desde?: string;
  hasta?: string;
  medioPago?: MedioPago;
}
