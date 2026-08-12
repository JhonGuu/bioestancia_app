import { EstadoCheque } from "@/modules/cheques/domain/estado-cheque";

/**
 * Representación de un Cheque/Echeq en el dominio.
 *
 * Nace siempre de una `LineaCobro` con `medioPago` CHEQUE o ECHEQ (ver
 * `modules/cobros`), pero se modela como entidad propia — no como un campo
 * más de esa línea — porque su ciclo de vida sigue mucho después de que el
 * cobro ya "cerró": puede tardar semanas en depositarse, acreditarse,
 * rechazarse, o endosarse a un proveedor.
 *
 * El tipo (cheque físico vs echeq) NO tiene campo propio acá: ya está
 * implícito en si la `LineaCobro` que lo originó era CHEQUE o ECHEQ
 * (`LineaCobro.medioPago`) — no hace falta duplicarlo.
 *
 * No referencia a su `LineaCobro` de origen (evita una dependencia circular
 * entre las tablas `cheques`/`lineas_cobro`) — la relación se puede
 * consultar al revés, desde `lineas_cobro.chequeId`, si hace falta.
 */
export interface Cheque {
  id: string;
  empresaId: string;
  clienteId: string;
  numero: string;
  banco: string;
  cuitLibrador: string | null;
  titular: string | null;
  fechaEmision: Date;
  /** Fecha de pago/vencimiento del cheque (no confundir con la fecha de la boleta). */
  fechaPago: Date;
  monto: number;
  estado: EstadoCheque;
  fechaUltimoCambioEstado: Date;
  /** Solo se espera cargado cuando `estado === RECHAZADO`. */
  motivoRechazo: string | null;
  comentarios: string | null;
  createdAt: Date;
  updatedAt: Date;
}
