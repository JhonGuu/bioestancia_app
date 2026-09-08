/**
 * Espejo de `apps/backend/src/modules/cobros/domain/*`.
 */

/**
 * Medios de pago con los que un cliente puede cancelar (total o
 * parcialmente) un `Cobro`. Un mismo cobro puede combinar varios — ej. una
 * parte en efectivo y una parte con un cheque — por eso vive en
 * `LineaCobro.medioPago`, no en `Cobro`. Objeto `as const` en vez de `enum`
 * (ver comentario en `auth.types.ts`).
 */
export const MedioPago = {
  EFECTIVO: "efectivo",
  TRANSFERENCIA_BANCO: "transferencia_banco",
  BILLETERA_VIRTUAL: "billetera_virtual",
  CHEQUE: "cheque",
  ECHEQ: "echeq",
  /** El cliente cancela sin que se mueva plata: se compensa contra otra cosa. Se trata igual que EFECTIVO. */
  COMPENSACION: "compensacion",
  /** Una retención que le practicaron al cliente se acredita como pago — reduce su deuda sin mover plata. Igual que EFECTIVO. */
  RETENCION: "retencion",
} as const;
export type MedioPago = (typeof MedioPago)[keyof typeof MedioPago];

export const MEDIO_PAGO_LABELS: Record<MedioPago, string> = {
  [MedioPago.EFECTIVO]: "Efectivo",
  [MedioPago.TRANSFERENCIA_BANCO]: "Transferencia bancaria",
  [MedioPago.BILLETERA_VIRTUAL]: "Billetera virtual",
  [MedioPago.CHEQUE]: "Cheque",
  [MedioPago.ECHEQ]: "Echeq",
  [MedioPago.COMPENSACION]: "Compensación",
  [MedioPago.RETENCION]: "Retención",
};

/** CHEQUE y ECHEQ son los únicos medios que generan un `Cheque` (ver `modules/cheques`, todavía sin espejo frontend). */
export function esMedioPagoCheque(medioPago: MedioPago): boolean {
  return medioPago === MedioPago.CHEQUE || medioPago === MedioPago.ECHEQ;
}

/** TRANSFERENCIA_BANCO y BILLETERA_VIRTUAL son los únicos medios con banco/billetera + remitente. */
export function esMedioPagoTransferencia(medioPago: MedioPago): boolean {
  return medioPago === MedioPago.TRANSFERENCIA_BANCO || medioPago === MedioPago.BILLETERA_VIRTUAL;
}

/**
 * `chequeId`: solo se completa cuando `medioPago` es CHEQUE o ECHEQ — el
 * backend crea el `Cheque` automáticamente al cargar la línea.
 */
export interface LineaCobro {
  id: string;
  cobroId: string;
  medioPago: MedioPago;
  monto: number;
  chequeId: string | null;
  /** Solo con TRANSFERENCIA_BANCO/BILLETERA_VIRTUAL — texto libre (ej. "Mercado Pago", "Banco Nación"). */
  bancoOBilletera: string | null;
  /** Solo con TRANSFERENCIA_BANCO/BILLETERA_VIRTUAL — quién hizo la transferencia (puede ser un tercero). */
  remitente: string | null;
  createdAt: string;
}

/**
 * Un cobro es un pago que hace un cliente — no necesariamente la
 * cancelación de una boleta puntual, el backend distribuye el monto entre
 * boletas pendientes con FIFO al crearlo.
 */
export interface Cobro {
  id: string;
  empresaId: string;
  clienteId: string;
  fecha: string;
  comentarios: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lo que devuelven `GET /cobros`, `GET /cobros/:id` y `POST /cobros`. */
export interface CobroConLineas extends Cobro {
  lineas: LineaCobro[];
}

/** El monto total del cobro no es un campo propio — es la suma de sus líneas (mismo criterio que el backend). */
export function montoTotalCobro(cobro: CobroConLineas): number {
  return cobro.lineas.reduce((acc, l) => acc + l.monto, 0);
}
