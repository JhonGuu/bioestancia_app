/**
 * Validación y normalización de los documentos que se cargan en el
 * directorio de transporte: CUIT/CUIL (personas y empresas) y patentes
 * (dominios de camiones, jaulas, acoplados y semis).
 *
 * Se validan bien desde el vamos porque el Remito Electrónico Cárnico de ARCA
 * (ver `plan-transportistas-choferes-vehiculos` y la investigación del REC en
 * el proyecto) rechaza el remito entero si el CUIT o el dominio del transporte
 * vienen mal formados.
 */

/** Deja solo los dígitos: "30-71687397-4" → "30716873974". */
export function normalizarCuit(valor: string): string {
  return valor.replace(/\D/g, "");
}

const PESOS_CUIT = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * CUIT/CUIL válido: 11 dígitos y dígito verificador correcto (módulo 11).
 * Acepta con o sin guiones.
 */
export function esCuitValido(valor: string): boolean {
  const cuit = normalizarCuit(valor);
  if (!/^\d{11}$/.test(cuit)) return false;
  const suma = PESOS_CUIT.reduce((acc, peso, i) => acc + peso * Number(cuit[i]), 0);
  const resto = suma % 11;
  const verificador = resto === 0 ? 0 : 11 - resto;
  // Un resultado de 10 no corresponde a ningún CUIT válido.
  if (verificador === 10) return false;
  return verificador === Number(cuit[10]);
}

/** Mayúsculas y sin espacios ni guiones: "ag 469-hw" → "AG469HW". */
export function normalizarPatente(valor: string): string {
  return valor.toUpperCase().replace(/[\s-]/g, "");
}

/** Formato viejo (ABC123) o Mercosur (AB123CD), ya normalizada. */
const PATENTE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export function esPatenteValida(valor: string): boolean {
  return PATENTE_REGEX.test(normalizarPatente(valor));
}
