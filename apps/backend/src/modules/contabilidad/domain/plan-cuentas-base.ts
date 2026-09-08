import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { TipoCuenta } from "@/modules/contabilidad/domain/tipo-cuenta";

/**
 * Plan de cuentas base para una empresa comercial (estructura estándar
 * argentina), con algunas cuentas propias del rubro (hacienda, faena,
 * valores a depositar, billeteras virtuales) para que sea usable el día uno
 * sin tener que inventar nada.
 *
 * ES UN PUNTO DE PARTIDA, NO UNA CAMISA DE FUERZA: se siembra una vez por
 * empresa y a partir de ahí se edita, se agregan cuentas y se desactivan las
 * que no se usan, todo desde la app. Cambiar algo acá NO afecta a las
 * empresas que ya tienen su plan sembrado.
 *
 * La jerarquía se deduce del código: el padre de "1.1.01.001" es "1.1.01".
 * Por eso los códigos tienen que ser consistentes acá; una vez sembrados, la
 * relación queda explícita en `parent_id` y el código se puede cambiar.
 *
 * `monetaria`: partidas en moneda de curso legal (efectivo, créditos y
 * deudas en pesos) que NO se ajustan por inflación. Todo lo demás
 * (mercadería, bienes de uso, capital, resultados) es no monetario y sí se
 * ajusta. Ver RT 6 y el campo `Cuenta.monetaria`.
 */
export interface CuentaBase {
  codigo: string;
  nombre: string;
  tipo: TipoCuenta;
  imputable: boolean;
  monetaria: boolean;
  requiereAuxiliar?: TipoAuxiliar;
}

const A = TipoCuenta.ACTIVO;
const P = TipoCuenta.PASIVO;
const PN = TipoCuenta.PATRIMONIO_NETO;
const RP = TipoCuenta.RESULTADO_POSITIVO;
const RN = TipoCuenta.RESULTADO_NEGATIVO;
const ORD = TipoCuenta.ORDEN;

/** Atajo: cuenta de agrupación (no recibe movimientos). */
const grupo = (codigo: string, nombre: string, tipo: TipoCuenta): CuentaBase => ({
  codigo,
  nombre,
  tipo,
  imputable: false,
  monetaria: false,
});

export const PLAN_CUENTAS_BASE: CuentaBase[] = [
  // ─────────────────────────── 1. ACTIVO ───────────────────────────
  grupo("1", "ACTIVO", A),
  grupo("1.1", "ACTIVO CORRIENTE", A),

  grupo("1.1.01", "Caja y bancos", A),
  { codigo: "1.1.01.001", nombre: "Caja", tipo: A, imputable: true, monetaria: true },
  { codigo: "1.1.01.002", nombre: "Fondo fijo", tipo: A, imputable: true, monetaria: true },
  { codigo: "1.1.01.003", nombre: "Banco cuenta corriente", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CUENTA_FONDOS },
  { codigo: "1.1.01.004", nombre: "Banco caja de ahorro", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CUENTA_FONDOS },
  { codigo: "1.1.01.005", nombre: "Billeteras virtuales", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CUENTA_FONDOS },
  { codigo: "1.1.01.006", nombre: "Valores a depositar", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CHEQUE },

  grupo("1.1.02", "Créditos por ventas", A),
  { codigo: "1.1.02.001", nombre: "Deudores por ventas", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CLIENTE },
  { codigo: "1.1.02.002", nombre: "Deudores morosos", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CLIENTE },
  { codigo: "1.1.02.003", nombre: "Cheques rechazados a cobrar", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CLIENTE },
  { codigo: "1.1.02.090", nombre: "Previsión para deudores incobrables", tipo: A, imputable: true, monetaria: true },

  grupo("1.1.03", "Otros créditos", A),
  { codigo: "1.1.03.001", nombre: "Anticipos a proveedores", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.PROVEEDOR },
  { codigo: "1.1.03.002", nombre: "IVA crédito fiscal", tipo: A, imputable: true, monetaria: true },
  { codigo: "1.1.03.003", nombre: "Retenciones y percepciones sufridas", tipo: A, imputable: true, monetaria: true },
  { codigo: "1.1.03.004", nombre: "Saldo a favor AFIP", tipo: A, imputable: true, monetaria: true },
  { codigo: "1.1.03.005", nombre: "Anticipos al personal", tipo: A, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.EMPLEADO },
  { codigo: "1.1.03.006", nombre: "Gastos pagados por adelantado", tipo: A, imputable: true, monetaria: false },

  grupo("1.1.04", "Bienes de cambio", A),
  { codigo: "1.1.04.001", nombre: "Mercadería de reventa", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.1.04.002", nombre: "Hacienda en pie", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.1.04.003", nombre: "Mercadería en tránsito", tipo: A, imputable: true, monetaria: false },

  grupo("1.2", "ACTIVO NO CORRIENTE", A),
  grupo("1.2.01", "Bienes de uso", A),
  { codigo: "1.2.01.001", nombre: "Inmuebles", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.2.01.002", nombre: "Rodados", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.2.01.003", nombre: "Maquinarias y equipos", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.2.01.004", nombre: "Instalaciones", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.2.01.005", nombre: "Muebles y útiles", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.2.01.006", nombre: "Equipos de computación", tipo: A, imputable: true, monetaria: false },
  { codigo: "1.2.01.090", nombre: "Amortización acumulada bienes de uso", tipo: A, imputable: true, monetaria: false },
  grupo("1.2.02", "Otros activos no corrientes", A),
  { codigo: "1.2.02.001", nombre: "Inversiones", tipo: A, imputable: true, monetaria: false },

  // ─────────────────────────── 2. PASIVO ───────────────────────────
  grupo("2", "PASIVO", P),
  grupo("2.1", "PASIVO CORRIENTE", P),

  grupo("2.1.01", "Deudas comerciales", P),
  { codigo: "2.1.01.001", nombre: "Proveedores", tipo: P, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.PROVEEDOR },
  { codigo: "2.1.01.002", nombre: "Frigoríficos a pagar", tipo: P, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.FRIGORIFICO },
  { codigo: "2.1.01.003", nombre: "Acreedores varios", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.01.004", nombre: "Cheques propios emitidos", tipo: P, imputable: true, monetaria: true },

  grupo("2.1.02", "Deudas fiscales", P),
  { codigo: "2.1.02.001", nombre: "IVA débito fiscal", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.02.002", nombre: "IVA a pagar", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.02.003", nombre: "Retenciones a depositar", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.02.004", nombre: "Ingresos brutos a pagar", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.02.005", nombre: "Impuesto a las ganancias a pagar", tipo: P, imputable: true, monetaria: true },

  grupo("2.1.03", "Deudas sociales", P),
  { codigo: "2.1.03.001", nombre: "Sueldos a pagar", tipo: P, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.EMPLEADO },
  { codigo: "2.1.03.002", nombre: "Cargas sociales a pagar", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.03.003", nombre: "Provisión para SAC", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.03.004", nombre: "Provisión para vacaciones", tipo: P, imputable: true, monetaria: true },

  grupo("2.1.04", "Deudas bancarias y financieras", P),
  { codigo: "2.1.04.001", nombre: "Préstamos bancarios", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.04.002", nombre: "Adelantos en cuenta corriente", tipo: P, imputable: true, monetaria: true },
  { codigo: "2.1.04.003", nombre: "Intereses a pagar", tipo: P, imputable: true, monetaria: true },

  grupo("2.1.05", "Otras deudas", P),
  { codigo: "2.1.05.001", nombre: "Anticipos de clientes", tipo: P, imputable: true, monetaria: true, requiereAuxiliar: TipoAuxiliar.CLIENTE },
  { codigo: "2.1.05.002", nombre: "Socios cuenta particular", tipo: P, imputable: true, monetaria: true },

  grupo("2.2", "PASIVO NO CORRIENTE", P),
  grupo("2.2.01", "Deudas a largo plazo", P),
  { codigo: "2.2.01.001", nombre: "Préstamos bancarios a largo plazo", tipo: P, imputable: true, monetaria: true },

  // ────────────────────── 3. PATRIMONIO NETO ──────────────────────
  grupo("3", "PATRIMONIO NETO", PN),
  grupo("3.1", "Capital", PN),
  { codigo: "3.1.01", nombre: "Capital social", tipo: PN, imputable: true, monetaria: false },
  { codigo: "3.1.02", nombre: "Aportes irrevocables", tipo: PN, imputable: true, monetaria: false },
  { codigo: "3.1.03", nombre: "Ajuste de capital", tipo: PN, imputable: true, monetaria: false },
  grupo("3.2", "Reservas", PN),
  { codigo: "3.2.01", nombre: "Reserva legal", tipo: PN, imputable: true, monetaria: false },
  { codigo: "3.2.02", nombre: "Reserva facultativa", tipo: PN, imputable: true, monetaria: false },
  grupo("3.3", "Resultados", PN),
  { codigo: "3.3.01", nombre: "Resultados no asignados", tipo: PN, imputable: true, monetaria: false },
  { codigo: "3.3.02", nombre: "Resultado del ejercicio", tipo: PN, imputable: true, monetaria: false },

  // ────────────────── 4. RESULTADOS POSITIVOS ──────────────────
  grupo("4", "RESULTADOS POSITIVOS", RP),
  grupo("4.1", "Ventas", RP),
  { codigo: "4.1.01", nombre: "Ventas de mercadería", tipo: RP, imputable: true, monetaria: false },
  { codigo: "4.1.02", nombre: "Ventas de hacienda", tipo: RP, imputable: true, monetaria: false },
  { codigo: "4.1.90", nombre: "Devoluciones y bonificaciones", tipo: RP, imputable: true, monetaria: false },
  grupo("4.2", "Otros ingresos", RP),
  { codigo: "4.2.01", nombre: "Intereses ganados", tipo: RP, imputable: true, monetaria: false },
  { codigo: "4.2.02", nombre: "Recargos por mora ganados", tipo: RP, imputable: true, monetaria: false },
  { codigo: "4.2.03", nombre: "Descuentos obtenidos", tipo: RP, imputable: true, monetaria: false },
  { codigo: "4.2.04", nombre: "Otros ingresos", tipo: RP, imputable: true, monetaria: false },
  grupo("4.3", "Resultado por exposición a la inflación", RP),
  { codigo: "4.3.01", nombre: "RECPAM", tipo: RP, imputable: true, monetaria: false },

  // ────────────────── 5. RESULTADOS NEGATIVOS ──────────────────
  grupo("5", "RESULTADOS NEGATIVOS", RN),
  grupo("5.1", "Costo de ventas", RN),
  { codigo: "5.1.01", nombre: "Costo de mercadería vendida", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.1.02", nombre: "Compras de hacienda", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.1.03", nombre: "Gastos de faena", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.1.04", nombre: "Fletes sobre compras", tipo: RN, imputable: true, monetaria: false },

  grupo("5.2", "Gastos de comercialización", RN),
  { codigo: "5.2.01", nombre: "Fletes y reparto", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.2.02", nombre: "Combustibles y lubricantes", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.2.03", nombre: "Comisiones sobre ventas", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.2.04", nombre: "Publicidad y propaganda", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.2.05", nombre: "Envases y embalajes", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.2.06", nombre: "Deudores incobrables", tipo: RN, imputable: true, monetaria: false },

  grupo("5.3", "Gastos de administración", RN),
  { codigo: "5.3.01", nombre: "Sueldos y jornales", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.02", nombre: "Cargas sociales", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.03", nombre: "Honorarios profesionales", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.04", nombre: "Alquileres", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.05", nombre: "Energía eléctrica, gas y agua", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.06", nombre: "Teléfono e internet", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.07", nombre: "Papelería y librería", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.08", nombre: "Seguros", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.09", nombre: "Mantenimiento y reparaciones", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.10", nombre: "Amortizaciones", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.3.11", nombre: "Gastos generales", tipo: RN, imputable: true, monetaria: false },

  grupo("5.4", "Gastos financieros", RN),
  { codigo: "5.4.01", nombre: "Intereses perdidos", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.4.02", nombre: "Comisiones y gastos bancarios", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.4.03", nombre: "Impuesto a los débitos y créditos", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.4.04", nombre: "Diferencias de cambio", tipo: RN, imputable: true, monetaria: false },

  grupo("5.5", "Impuestos y tasas", RN),
  { codigo: "5.5.01", nombre: "Ingresos brutos", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.5.02", nombre: "Tasas municipales", tipo: RN, imputable: true, monetaria: false },
  { codigo: "5.5.03", nombre: "Impuesto a las ganancias", tipo: RN, imputable: true, monetaria: false },

  // ────────────────────── 6. CUENTAS DE ORDEN ──────────────────────
  grupo("6", "CUENTAS DE ORDEN", ORD),
  { codigo: "6.01", nombre: "Cheques de terceros endosados", tipo: ORD, imputable: true, monetaria: true },
  { codigo: "6.02", nombre: "Garantías otorgadas", tipo: ORD, imputable: true, monetaria: true },
];

/**
 * Código del padre según la convención jerárquica del catálogo: se corta el
 * último tramo separado por punto. "1.1.01.001" → "1.1.01"; "1" → null.
 */
export function codigoPadre(codigo: string): string | null {
  const partes = codigo.split(".");
  if (partes.length <= 1) return null;
  return partes.slice(0, -1).join(".");
}
