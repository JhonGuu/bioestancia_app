/**
 * Paleta compartida por los generadores de PDF — mismo espíritu que los
 * colores semánticos ya usados en pantalla (`movimientos-cuenta-corriente-list.tsx`,
 * badges de estado, etc.), adaptado a 4 categorías bien diferenciadas para
 * que un vistazo rápido al PDF alcance para identificar de qué se trata cada
 * renglón:
 *
 * - `cobro` (verde): un pago del cliente — evento positivo para la cuenta.
 * - `cargo` (ámbar): un cargo genérico (recargo por cheque a >7 días,
 *   comisión) — plata de más que el cliente pasa a deber.
 * - `rechazo` (rojo): specíficamente un cheque rechazado (la línea
 *   informativa y su comisión) y boletas vencidas — necesita atención.
 * - `compensacion` (gris azulado): un ajuste de kg dentro de una boleta —
 *   neutral, no es ni un cobro ni un problema.
 *
 * Los colores de "marca" son un acento aparte (ver `brandColorParaEmpresa`),
 * pensados para encabezados y títulos — no se mezclan con los semánticos de
 * arriba.
 */
export const PDF_COLORS = {
  text: "#1F2937",
  textMuted: "#6B7280",
  border: "#E5E7EB",
  headerBg: "#F3F4F6",
  headerText: "#111827",
  zebra: "#FAFAFA",
  white: "#FFFFFF",

  cobro: "#15803D",
  cobroBg: "#F0FDF4",
  cobroBorder: "#BBF7D0",

  cargo: "#B45309",
  cargoBg: "#FFFBEB",
  cargoBorder: "#FDE68A",

  rechazo: "#B91C1C",
  rechazoBg: "#FEF2F2",
  rechazoBorder: "#FECACA",

  compensacion: "#475569",
  compensacionBg: "#F1F5F9",
  compensacionBorder: "#CBD5E1",
} as const;

/**
 * Color de acento de marca según la empresa — mismo criterio de detección
 * que `logoParaEmpresa` (busca "bioestancia"/"meridiano" en la razón
 * social). El Meridiano tiene isotipo monocromático (sin color propio), así
 * que usa un gris carbón neutro en vez de inventarle un color — igual que
 * cualquier empresa nueva sin marca reconocida.
 */
export function brandColorParaEmpresa(razonSocial: string): string {
  const normalizado = razonSocial.toLowerCase();
  if (normalizado.includes("bioestancia")) return "#1F7A4D";
  return "#1F2937";
}
