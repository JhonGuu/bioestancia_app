import { MedioPago } from "@/modules/cobros/domain/medio-pago";

/**
 * Una línea de un `Cobro` — un cobro puede combinar varios medios de pago
 * (ej. parte efectivo + parte cheque), por eso el monto y el medio de pago
 * viven acá y no en la cabecera.
 *
 * `chequeId`: solo se completa cuando `medioPago` es CHEQUE o ECHEQ —
 * referencia el `Cheque` que `CreateCobro` crea automáticamente para esa
 * línea (ver `modules/cheques`). Nunca se crea un `Cheque` desde otro lugar.
 *
 * No es una entidad editable de forma independiente — nace y muere con su
 * `Cobro` (no tiene `activo`/`deletedAt` propio, mismo criterio que
 * `compra_categorias`).
 */
export interface LineaCobro {
  id: string;
  cobroId: string;
  medioPago: MedioPago;
  monto: number;
  chequeId: string | null;
  /**
   * Banco o billetera virtual (texto libre, ej. "Banco Nación", "Mercado
   * Pago") — solo tiene sentido cuando `medioPago` es TRANSFERENCIA_BANCO o
   * BILLETERA_VIRTUAL.
   */
  bancoOBilletera: string | null;
  /**
   * Quién hizo la transferencia (texto libre) — cubre el caso de que el
   * cliente le pida a UN TERCERO (ej. su propio cliente) que transfiera
   * directamente a la empresa; solo tiene sentido junto con
   * TRANSFERENCIA_BANCO/BILLETERA_VIRTUAL.
   */
  remitente: string | null;
  createdAt: Date;
}
