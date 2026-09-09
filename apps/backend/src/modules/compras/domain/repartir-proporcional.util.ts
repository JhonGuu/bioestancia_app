/**
 * Reparte `total` entre `pesos` (paralelo por índice) proporcionalmente,
 * ajustando el ÚLTIMO elemento para que la suma dé EXACTO — evita que el
 * redondeo de cada línea deje un resto sin asignar en ninguna.
 *
 * Usado por el importador histórico de compras (para repartir kg de faena/
 * canon entre categorías) y por `CrearGrupoTropas` (para repartir el peso
 * real del grupo entre las tropas miembro, proporcional a sus cabezas) — ver
 * `plan-unificacion-tropas-despacho.md`.
 */
export function repartirProporcional(total: number, pesos: number[]): number[] {
  const sumaPesos = pesos.reduce((acc, p) => acc + p, 0);
  if (sumaPesos <= 0) return pesos.map(() => 0);

  const resultado: number[] = [];
  let acumulado = 0;
  for (let i = 0; i < pesos.length; i++) {
    if (i === pesos.length - 1) {
      resultado.push(Math.round((total - acumulado) * 100) / 100);
    } else {
      const parte = Math.round(total * (pesos[i]! / sumaPesos) * 100) / 100;
      resultado.push(parte);
      acumulado += parte;
    }
  }
  return resultado;
}
