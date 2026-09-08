import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

/**
 * Eventos de negocio que pueden disparar un asiento automático (fase 2).
 *
 * Cada uno corresponde a un momento puntual en OTRO módulo del sistema —
 * nunca a una acción propia de `contabilidad` — y define qué campos trae su
 * "unidad evaluable" (ver `UnidadEventoContable` en `eventos-contables.ts`)
 * y por lo tanto qué `expresion`/`auxiliarResolver` tienen sentido en sus
 * reglas (ver `EXPRESIONES_POR_EVENTO`/`AUXILIARES_POR_EVENTO` abajo).
 *
 * El cargo en cuenta corriente se modela como CUATRO eventos separados (uno
 * por `TipoCargo` de `modules/cargos-cuenta-corriente`) en vez de uno solo
 * genérico — cada tipo va a un par de cuentas distinto (un recargo es un
 * ingreso nuevo, una reversión por rechazo es lo contrario de un cobro), así
 * que separarlos hace que cada regla sea más simple de armar que una única
 * regla con una condición por tipo.
 */
export enum EventoAsiento {
  BOLETA_FACTURADA = "boleta_facturada",
  COBRO_REGISTRADO = "cobro_registrado",
  CHEQUE_DEPOSITADO = "cheque_depositado",
  CARGO_RECARGO_CHEQUE = "cargo_recargo_cheque",
  CARGO_RECHAZO_CHEQUE = "cargo_rechazo_cheque",
  CARGO_COMISION_RECHAZO = "cargo_comision_rechazo",
  CARGO_OTRO = "cargo_otro",
  COMPRA_TROPA = "compra_tropa",
  LIQUIDACION_COMPRA = "liquidacion_compra",
  LIQUIDACION_FAENA = "liquidacion_faena",
}

export const EVENTOS_ASIENTO_LABELS: Record<EventoAsiento, string> = {
  [EventoAsiento.BOLETA_FACTURADA]: "Boleta facturada (venta con precio)",
  [EventoAsiento.COBRO_REGISTRADO]: "Cobro registrado",
  [EventoAsiento.CHEQUE_DEPOSITADO]: "Cheque depositado",
  [EventoAsiento.CARGO_RECARGO_CHEQUE]: "Recargo por cheque a más de 7 días",
  [EventoAsiento.CARGO_RECHAZO_CHEQUE]: "Reversión por cheque rechazado",
  [EventoAsiento.CARGO_COMISION_RECHAZO]: "Comisión por cheque rechazado",
  [EventoAsiento.CARGO_OTRO]: "Cargo manual en cuenta corriente",
  [EventoAsiento.COMPRA_TROPA]: "Compra de tropa",
  [EventoAsiento.LIQUIDACION_COMPRA]: "Liquidación de compra",
  [EventoAsiento.LIQUIDACION_FAENA]: "Liquidación de faena",
};

/**
 * `origen_tipo` que se guarda en la cabecera del asiento — permite ubicar
 * (y no duplicar) el asiento automático de un documento puntual vía
 * `AsientoRepository.getByOrigen(empresaId, origenTipo, origenId)`. Los
 * cuatro eventos de cargo comparten `"cargo_cuenta_corriente"` porque cada
 * `CargoCuentaCorriente` ya es una fila propia con `id` distinto — no hace
 * falta un `origenTipo` distinto para no pisarse.
 */
export const ORIGEN_TIPO_POR_EVENTO: Record<EventoAsiento, string> = {
  [EventoAsiento.BOLETA_FACTURADA]: "boleta",
  [EventoAsiento.COBRO_REGISTRADO]: "cobro",
  [EventoAsiento.CHEQUE_DEPOSITADO]: "cheque_depositado",
  [EventoAsiento.CARGO_RECARGO_CHEQUE]: "cargo_cuenta_corriente",
  [EventoAsiento.CARGO_RECHAZO_CHEQUE]: "cargo_cuenta_corriente",
  [EventoAsiento.CARGO_COMISION_RECHAZO]: "cargo_cuenta_corriente",
  [EventoAsiento.CARGO_OTRO]: "cargo_cuenta_corriente",
  [EventoAsiento.COMPRA_TROPA]: "compra",
  [EventoAsiento.LIQUIDACION_COMPRA]: "liquidacion_compra",
  [EventoAsiento.LIQUIDACION_FAENA]: "liquidacion_faena",
};

/** Campos numéricos válidos como `expresion` de una línea — varían según qué trae la "unidad" de cada evento (ver `eventos-contables.ts`). */
export type ExpresionMontoRegla =
  | "monto"
  | "importeBruto"
  | "importeIva"
  | "totalGastos"
  | "ivaSobreGastos"
  | "totalTributos"
  | "total";

export const EXPRESIONES_POR_EVENTO: Record<EventoAsiento, ExpresionMontoRegla[]> = {
  [EventoAsiento.BOLETA_FACTURADA]: ["monto"],
  [EventoAsiento.COBRO_REGISTRADO]: ["monto"],
  [EventoAsiento.CHEQUE_DEPOSITADO]: ["monto"],
  [EventoAsiento.CARGO_RECARGO_CHEQUE]: ["monto"],
  [EventoAsiento.CARGO_RECHAZO_CHEQUE]: ["monto"],
  [EventoAsiento.CARGO_COMISION_RECHAZO]: ["monto"],
  [EventoAsiento.CARGO_OTRO]: ["monto"],
  [EventoAsiento.COMPRA_TROPA]: ["monto"],
  [EventoAsiento.LIQUIDACION_COMPRA]: ["importeBruto", "importeIva", "totalGastos", "ivaSobreGastos", "totalTributos"],
  [EventoAsiento.LIQUIDACION_FAENA]: ["total"],
};

/** De dónde sale el `auxiliarId` de una línea — el nombre coincide con el campo `<resolver>Id` de `UnidadEventoContable`. */
export type AuxiliarResolverRegla = "cliente" | "proveedor" | "frigorifico" | "cheque";

export const AUXILIARES_POR_EVENTO: Record<EventoAsiento, AuxiliarResolverRegla[]> = {
  [EventoAsiento.BOLETA_FACTURADA]: ["cliente"],
  [EventoAsiento.COBRO_REGISTRADO]: ["cliente", "cheque"],
  [EventoAsiento.CHEQUE_DEPOSITADO]: ["cliente", "cheque"],
  [EventoAsiento.CARGO_RECARGO_CHEQUE]: ["cliente", "cheque"],
  [EventoAsiento.CARGO_RECHAZO_CHEQUE]: ["cliente", "cheque"],
  [EventoAsiento.CARGO_COMISION_RECHAZO]: ["cliente", "cheque"],
  [EventoAsiento.CARGO_OTRO]: ["cliente"],
  [EventoAsiento.COMPRA_TROPA]: ["proveedor"],
  [EventoAsiento.LIQUIDACION_COMPRA]: ["proveedor"],
  [EventoAsiento.LIQUIDACION_FAENA]: ["frigorifico"],
};

export function tipoAuxiliarDeResolver(resolver: AuxiliarResolverRegla): TipoAuxiliar {
  switch (resolver) {
    case "cliente":
      return TipoAuxiliar.CLIENTE;
    case "proveedor":
      return TipoAuxiliar.PROVEEDOR;
    case "frigorifico":
      return TipoAuxiliar.FRIGORIFICO;
    case "cheque":
      return TipoAuxiliar.CHEQUE;
  }
}

export type LadoLineaRegla = "debe" | "haber";

/**
 * Una línea de la "plantilla" de una regla — no un movimiento concreto: el
 * monto y el auxiliar recién se resuelven al evaluarla contra una unidad de
 * un evento puntual (ver `evaluar-regla-asiento.ts`).
 */
export interface ReglaAsientoLinea {
  id: string;
  reglaId: string;
  orden: number;
  lado: LadoLineaRegla;
  cuentaId: string;
  expresion: ExpresionMontoRegla;
  auxiliarResolver: AuxiliarResolverRegla | null;
}

/**
 * Una regla de asiento automático: "cuando pasa el evento X (y, si hay
 * `condicion`, la unidad matchea), generá estas líneas". Varias reglas
 * pueden compartir el mismo `evento` con `condicion` distintas (ej. una por
 * `medioPago` de cobro) — para una unidad dada, se usa la primera activa que
 * matchea, en orden de `prioridad` ascendente.
 *
 * "Cuenta dinámica" (ej. Caja según el medio de pago) se logra armando
 * VARIAS reglas con `condicion` distinta, no con una mini-DSL de resolución
 * de cuentas — más simple de configurar desde la UI, sin perder
 * flexibilidad real.
 */
export interface ReglaAsiento {
  id: string;
  empresaId: string;
  evento: EventoAsiento;
  nombre: string;
  activa: boolean;
  prioridad: number;
  /** Ej. `{"medioPago": "efectivo"}` — todas las claves tienen que matchear (comparación de texto exacta) contra la unidad. `null`/vacío = siempre aplica. */
  condicion: Record<string, string> | null;
  lineas: ReglaAsientoLinea[];
}
