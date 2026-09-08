import { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";
import { ReglaAsiento, tipoAuxiliarDeResolver } from "@/modules/contabilidad/domain/regla-asiento";
import { UnidadEventoContable } from "@/modules/contabilidad/domain/eventos-contables";

export interface LineaGeneradaPorRegla {
  cuentaId: string;
  debe: number;
  haber: number;
  auxiliarTipo: TipoAuxiliar | null;
  auxiliarId: string | null;
}

/**
 * ¿Esta regla aplica a esta unidad? Tiene que estar activa y, si tiene
 * `condicion`, cada clave tiene que matchear (comparación de texto exacta)
 * contra el campo homónimo de la unidad.
 */
export function reglaAplicaAUnidad(regla: ReglaAsiento, unidad: UnidadEventoContable): boolean {
  if (!regla.activa) return false;
  if (!regla.condicion) return true;
  const contexto = unidad as unknown as Record<string, unknown>;
  return Object.entries(regla.condicion).every(([clave, valor]) => String(contexto[clave] ?? "") === valor);
}

/**
 * Resuelve las líneas de UNA regla contra UNA unidad — función pura, no
 * toca la base.
 *
 * Una línea se omite (no se genera) si su `expresion` no resuelve a un
 * número distinto de cero en la unidad, o si pide un auxiliar
 * (`auxiliarResolver`) que la unidad no trae — así una regla no rompe el
 * asiento entero cuando le falta un dato opcional (ej. `totalGastos` en una
 * liquidación de compra sin gastos).
 *
 * Casi todo evento trae valores siempre positivos (una venta, un cobro),
 * así que el `lado` configurado en la línea (debe/haber) alcanza tal cual.
 * Pero `CARGO_OTRO` admite montos negativos (ej. un "ajuste por diferencia"
 * que reduce la deuda del cliente en vez de aumentarla) — cuando `valor` es
 * negativo, el efecto contable es el opuesto al de un valor positivo, así
 * que la línea se genera del lado CONTRARIO al configurado en la regla (con
 * el valor absoluto). Como esto aplica por igual a todas las líneas de la
 * regla que miran ese mismo campo, el asiento sigue balanceado.
 */
export function evaluarReglaAsiento(regla: ReglaAsiento, unidad: UnidadEventoContable): LineaGeneradaPorRegla[] {
  const contexto = unidad as unknown as Record<string, unknown>;
  const lineas: LineaGeneradaPorRegla[] = [];

  for (const lineaRegla of [...regla.lineas].sort((a, b) => a.orden - b.orden)) {
    const valor = contexto[lineaRegla.expresion];
    if (typeof valor !== "number" || valor === 0) continue;
    const monto = Math.round(Math.abs(valor) * 100) / 100;
    const lado = valor < 0 ? (lineaRegla.lado === "debe" ? "haber" : "debe") : lineaRegla.lado;

    let auxiliarTipo: TipoAuxiliar | null = null;
    let auxiliarId: string | null = null;
    if (lineaRegla.auxiliarResolver) {
      const idValor = contexto[`${lineaRegla.auxiliarResolver}Id`];
      if (typeof idValor !== "string" || !idValor) continue; // sin auxiliar disponible — no se puede generar esta línea
      auxiliarTipo = tipoAuxiliarDeResolver(lineaRegla.auxiliarResolver);
      auxiliarId = idValor;
    }

    lineas.push({
      cuentaId: lineaRegla.cuentaId,
      debe: lado === "debe" ? monto : 0,
      haber: lado === "haber" ? monto : 0,
      auxiliarTipo,
      auxiliarId,
    });
  }

  return lineas;
}
