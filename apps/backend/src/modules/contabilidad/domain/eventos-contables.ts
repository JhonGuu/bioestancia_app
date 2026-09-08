import { EventoAsiento } from "@/modules/contabilidad/domain/regla-asiento";

/**
 * "Unidad evaluable" de un evento contable — un registro plano de datos
 * primitivos contra el que se matchean las `condicion` de las reglas y se
 * resuelven sus `expresion`/`auxiliarResolver` (ver `evaluar-regla-asiento.ts`).
 *
 * La mayoría de los eventos generan UNA sola unidad por documento; el único
 * que genera varias es `cobro_registrado` — una por `LineaCobro`, porque
 * cada una puede ir a una cuenta distinta según `medioPago` (parte efectivo,
 * parte cheque).
 *
 * A propósito esta interfaz NO importa ningún tipo de otro módulo (`Venta`,
 * `Cobro`, `Cheque`, etc.) — quien arma la unidad es el módulo dueño del
 * evento (ver los "ganchos" en `boletas`, `cobros`, `cheques`,
 * `cargos-cuenta-corriente`, `compras`, `liquidacion-compra`,
 * `liquidacion-faena`), nunca `contabilidad`. Esto mantiene el motor de
 * reglas genérico y a `contabilidad` sin depender del dominio de los otros
 * módulos de negocio.
 */
export interface UnidadEventoContable {
  monto?: number;
  importeBruto?: number;
  importeIva?: number;
  totalGastos?: number;
  ivaSobreGastos?: number;
  totalTributos?: number;
  total?: number;
  /** Solo lo trae `cobro_registrado` — para que la `condicion` de la regla lo pueda matchear (ej. `{"medioPago": "efectivo"}`). */
  medioPago?: string;
  clienteId?: string | null;
  proveedorId?: string | null;
  frigorificoId?: string | null;
  chequeId?: string | null;
}

export interface GenerarAsientosAutomaticosInput {
  empresaId: string;
  evento: EventoAsiento;
  /** Id del documento de origen: boletaId, cobroId, chequeId, cargoId, compraId o liquidacionId según el evento. */
  origenId: string;
  fecha: Date;
  descripcion: string;
  unidades: UnidadEventoContable[];
}

export interface ResultadoGenerarAsientosAutomaticos {
  /** `true` si se creó, actualizó o eliminó (por quedar en $0) un asiento borrador. */
  generado: boolean;
  /**
   * Explica por qué no se generó/actualizó nada, o qué quedó pendiente —
   * NUNCA bloquea la operación que disparó el evento (crear la boleta,
   * confirmar el cobro, etc. se guarda igual). Pensado para mostrarse como
   * aviso no bloqueante en el frontend.
   */
  advertencia?: string;
}
