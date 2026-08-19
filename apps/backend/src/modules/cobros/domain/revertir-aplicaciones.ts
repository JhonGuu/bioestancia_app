import { AplicacionCobro } from "@/modules/cobros/domain/aplicacion-cobro";

export interface AjusteAplicacion {
  id: string;
  nuevoMonto: number;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Si lo aplicado a una boleta (`aplicaciones`, ya filtradas por esa boleta
 * puntual) supera `nuevoMontoMax` — el monto REAL de la boleta después de
 * editarla o borrarla (ver `use-cases/update-venta-item.use-case.ts`,
 * `delete-venta.use-case.ts`, `delete-boleta.use-case.ts` y
 * `set-precio-venta.use-case.ts`) — calcula los ajustes para revertir el
 * exceso, más reciente primero (mismo criterio LIFO que
 * `ConfirmarRechazoCheque`).
 *
 * El excedente revertido NO se reasigna a otras boletas del cliente: queda
 * como saldo a favor, que `calcularSaldoCliente` ya calcula solo
 * (`totalCobrado - totalAplicado` a nivel cliente) — no hace falta tocar
 * nada más para que aparezca.
 *
 * Función pura — no toca ningún repositorio, para poder reusarla desde
 * `ventas` y `boletas` sin que esos módulos dependan de una clase inyectable
 * de `cobros` (evita un ciclo en el orden de registro del container, ver
 * comentario en `di.ts`).
 */
export function calcularAjustesReversionBoleta(
  aplicaciones: Pick<AplicacionCobro, "id" | "monto" | "createdAt">[],
  nuevoMontoMax: number,
): AjusteAplicacion[] {
  const totalAplicado = aplicaciones.reduce((acc, a) => acc + a.monto, 0);
  const exceso = redondear(totalAplicado - nuevoMontoMax);
  if (exceso <= 0.01) return [];

  const ordenadas = [...aplicaciones].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  let restante = exceso;
  const ajustes: AjusteAplicacion[] = [];
  for (const aplicacion of ordenadas) {
    if (restante <= 0.01) break;
    const aRevertir = Math.min(restante, aplicacion.monto);
    ajustes.push({ id: aplicacion.id, nuevoMonto: redondear(aplicacion.monto - aRevertir) });
    restante = redondear(restante - aRevertir);
  }
  return ajustes;
}
