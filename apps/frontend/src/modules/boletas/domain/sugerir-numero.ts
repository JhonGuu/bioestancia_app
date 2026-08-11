import type { Boleta } from "@/modules/boletas/domain/boleta.types";

/**
 * Sugiere el próximo número de boleta: toma la última boleta cargada (por
 * fecha de creación) e incrementa en 1 la última corrida de dígitos de su
 * `numero`, preservando prefijo/ceros a la izquierda/sufijo tal cual
 * (ej. "0026-00002179" → "0026-00002180"). Es solo una sugerencia — el campo
 * queda editable, así que un heurístico simple alcanza (no hace falta
 * pedirle al backend el máximo real).
 *
 * Devuelve "" si no hay boletas previas, o si la última no tiene número, o
 * si no tiene ningún dígito al final para incrementar.
 */
export function sugerirProximoNumero(boletas: Boleta[]): string {
  if (boletas.length === 0) return "";

  const ultima = [...boletas].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  if (!ultima?.numero) return "";

  const match = ultima.numero.match(/(\d+)(\D*)$/);
  if (!match) return "";

  const [, digitos, sufijo] = match;
  const incrementado = String(Number(digitos) + 1).padStart(digitos.length, "0");
  const prefijo = ultima.numero.slice(0, ultima.numero.length - digitos.length - sufijo.length);
  return `${prefijo}${incrementado}${sufijo}`;
}
