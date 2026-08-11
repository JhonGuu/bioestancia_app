/**
 * Formateo compartido por los generadores de documentos (PDF/Excel) — un
 * solo lugar para no repetir `Intl.NumberFormat`/`toLocaleDateString` con
 * configuraciones ligeramente distintas en cada generador.
 */

const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

const formatoKg = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatearMoneda(valor: number): string {
  return formatoMoneda.format(valor);
}

export function formatearKg(valor: number): string {
  return formatoKg.format(valor);
}

/** `fecha` es siempre calendario UTC en este dominio (ver comentario en `filtro-periodo.ts` del frontend). */
export function formatearFechaUTC(fecha: Date): string {
  return fecha.toLocaleDateString("es-AR", { timeZone: "UTC" });
}
