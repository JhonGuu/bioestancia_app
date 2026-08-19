/**
 * DTE (SENASA) y Remito son datos que identifican UNÍVOCAMENTE la tropa que
 * se está comprando — un dígito de más/menos hace que la compra quede mal
 * referenciada. Ambos tienen un formato fijo de cantidad de dígitos con un
 * guion antes del último grupo, así que el input se enmascara solo (el
 * guion se inserta automático apenas se completa el primer grupo, y no deja
 * tipear más dígitos de los que corresponden) en vez de confiar en que la
 * persona lo escriba bien a mano.
 *
 * DTE:    032369757-4   → 9 dígitos + guion + 1 dígito
 * Remito: 0001-008226   → 4 dígitos + guion + 6 dígitos
 */
const DTE_GRUPOS = [9, 1];
const REMITO_GRUPOS = [4, 6];

export const DTE_REGEX = /^\d{9}-\d$/;
export const REMITO_REGEX = /^\d{4}-\d{6}$/;

export const DTE_PLACEHOLDER = "032369757-4";
export const REMITO_PLACEHOLDER = "0001-008226";

export const DTE_MENSAJE_FORMATO = `Formato inválido — tiene que ser como ${DTE_PLACEHOLDER}`;
export const REMITO_MENSAJE_FORMATO = `Formato inválido — tiene que ser como ${REMITO_PLACEHOLDER}`;

/**
 * Reformatea `valorCrudo` (lo que haya en el input, con o sin guiones) según
 * `grupos` — ej. `[9, 1]` da "XXXXXXXXX-X". Descarta todo lo que no sea
 * dígito y trunca al total de dígitos que entran en los grupos, así que no
 * hay forma de terminar con más (ni con el guion en el lugar equivocado).
 */
function formatearConGuion(valorCrudo: string, grupos: number[]): string {
  const totalDigitos = grupos.reduce((acc, g) => acc + g, 0);
  const digitos = valorCrudo.replace(/\D/g, "").slice(0, totalDigitos);

  let resultado = "";
  let posicion = 0;
  for (const largoGrupo of grupos) {
    const grupo = digitos.slice(posicion, posicion + largoGrupo);
    if (!grupo) break;
    resultado += (resultado ? "-" : "") + grupo;
    posicion += largoGrupo;
  }
  return resultado;
}

export function formatearDte(valorCrudo: string): string {
  return formatearConGuion(valorCrudo, DTE_GRUPOS);
}

export function formatearRemito(valorCrudo: string): string {
  return formatearConGuion(valorCrudo, REMITO_GRUPOS);
}
