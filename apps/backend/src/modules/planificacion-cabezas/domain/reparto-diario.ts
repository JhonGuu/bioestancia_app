/**
 * Reparto de un día: lo que se manda por WhatsApp a la planta/reparto con
 * las cabezas a entregar a cada cliente al día siguiente (o el que sea).
 *
 * Sale de `planificacion_cabezas` — no tiene tabla propia. Es una vista de
 * lectura del plan de UN día, ordenada para leerse de un vistazo desde el
 * celular.
 */
export interface LineaReparto {
  clienteId: string;
  /** Razón social o nombre+apellido (ver `nombreCliente`). */
  cliente: string;
  cabezas: number;
  /** Aclaración del plan ("sin confirmar", "seleccionar lindas, ~45 kg la media"). */
  comentarios: string | null;
}

export interface RepartoDiario {
  empresa: { id: string; razonSocial: string };
  /** Día del reparto, "YYYY-MM-DD". */
  fecha: string;
  lineas: LineaReparto[];
  totalCabezas: number;
  /**
   * Clientes habituales que ESE día no llevan: los que llevaron cabezas
   * (planificadas o entregadas) en las últimas `VENTANA_HABITUALES_DIAS`
   * jornadas y hoy tienen 0. Sirve para que el reparto avise explícitamente
   * "Ramírez no lleva" en vez de que su ausencia pase desapercibida.
   */
  noLlevan: string[];
  generadoEn: Date;
}

/** Cuántos días para atrás se mira para decidir quién es cliente "habitual". */
export const VENTANA_HABITUALES_DIAS = 28;
