/**
 * Espejo de `apps/backend/src/modules/transportes/domain/documento-transporte.ts`:
 * misma validación de CUIT (dígito verificador) y de patente, para avisar en
 * el formulario antes de mandar el pedido.
 */

/** Deja solo los dígitos: "30-71687397-4" → "30716873974". */
export function normalizarCuit(valor: string): string {
  return valor.replace(/\D/g, "");
}

const PESOS_CUIT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function esCuitValido(valor: string): boolean {
  const cuit = normalizarCuit(valor);
  if (!/^\d{11}$/.test(cuit)) return false;
  const suma = PESOS_CUIT.reduce((acc, peso, i) => acc + peso * Number(cuit[i]), 0);
  const resto = suma % 11;
  const verificador = resto === 0 ? 0 : 11 - resto;
  if (verificador === 10) return false;
  return verificador === Number(cuit[10]);
}

/** "30716873974" → "30-71687397-4" (si no tiene 11 dígitos, lo devuelve tal cual). */
export function formatearCuit(valor: string): string {
  const cuit = normalizarCuit(valor);
  if (cuit.length !== 11) return valor;
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`;
}

export function normalizarPatente(valor: string): string {
  return valor.toUpperCase().replace(/[\s-]/g, "");
}

/** Formato viejo (ABC123) o Mercosur (AB123CD). */
export function esPatenteValida(valor: string): boolean {
  return /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(normalizarPatente(valor));
}

/** "2027-05-01" → "01/05/2027". Sin pasar por `Date`, para que la zona horaria no corra el día. */
export function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

export type EstadoVencimiento = "vencido" | "por_vencer" | "vigente";

/** Días de aviso previo antes de que un vencimiento se marque "por vencer". */
export const DIAS_AVISO_VENCIMIENTO = 30;

/**
 * Estado de un vencimiento ("AAAA-MM-DD") respecto de hoy: vencido, por
 * vencer (dentro de los próximos 30 días) o vigente. `null` si no hay fecha.
 */
export function estadoVencimiento(fecha: string | null, hoy: Date = new Date()): EstadoVencimiento | null {
  if (!fecha) return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const venc = Date.UTC(anio, mes - 1, dia);
  const hoyUtc = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.round((venc - hoyUtc) / 86_400_000);
  if (dias < 0) return "vencido";
  if (dias <= DIAS_AVISO_VENCIMIENTO) return "por_vencer";
  return "vigente";
}
