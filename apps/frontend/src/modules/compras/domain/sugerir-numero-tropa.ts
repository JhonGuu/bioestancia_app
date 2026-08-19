import type { Compra } from "@/modules/compras/domain/compra.types";

/**
 * Sugiere el próximo número de tropa: toma la última compra cargada (por
 * `fecha` de la tropa, no de creación) e incrementa en 1 la última corrida de
 * dígitos de su `numero`, preservando prefijo/ceros a la izquierda/sufijo tal
 * cual — mismo criterio que `sugerirProximoNumero` de boletas (ver
 * `modules/boletas/domain/sugerir-numero.ts`).
 *
 * A principio de año la numeración arranca de nuevo desde 1: el negocio
 * renueva el número de tropa cada año (ej. venían de la tropa 400 y en enero
 * vuelven a arrancar en la 1). Si la última compra es de un año calendario
 * anterior al de `ahora`, se sugiere "1" (con el mismo prefijo/sufijo de la
 * última, si tenía uno — ej. "12-BIO" del año pasado sugiere "1-BIO" este
 * año, no "13-BIO") en vez de continuar la numeración vieja. Es solo una
 * sugerencia — el campo queda editable, así que un heurístico simple alcanza.
 *
 * `compras` tiene que venir ya filtrada por la empresa activa (el backend
 * scopea todo por `empresaId` de la sesión) — acá no se filtra de nuevo.
 *
 * Devuelve "" si no hay compras previas, o si la última no tiene ningún
 * dígito al final para incrementar.
 */
export function sugerirProximoNumeroTropa(compras: Compra[], ahora: Date = new Date()): string {
  if (compras.length === 0) return "";

  const ultima = [...compras].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
  if (!ultima?.numero) return "";

  const match = ultima.numero.match(/(\d+)(\D*)$/);
  if (!match) return "";

  const [, digitos, sufijo] = match;
  const prefijo = ultima.numero.slice(0, ultima.numero.length - digitos.length - sufijo.length);

  const esDeAñoAnterior = new Date(ultima.fecha).getUTCFullYear() < ahora.getUTCFullYear();
  const siguiente = esDeAñoAnterior ? 1 : Number(digitos) + 1;
  const incrementado = String(siguiente).padStart(digitos.length, "0");

  return `${prefijo}${incrementado}${sufijo}`;
}
