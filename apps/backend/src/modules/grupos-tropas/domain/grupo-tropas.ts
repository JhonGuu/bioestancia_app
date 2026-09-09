/**
 * Representación de un "Grupo de tropas" en el dominio.
 *
 * Resuelve dos situaciones reales donde 2+ `Compra` (tropas) necesitan
 * tratarse como una sola unidad para el cálculo del rinde de DESPACHO (el
 * rinde de FAENA sigue siendo específico por tropa, vía `ResultadoFaena`):
 *
 * 1. Aparece un animal de más al faenar: se pide un DTE adicional, se crea
 *    una tropa nueva para ese animal, y el peso neto original en realidad
 *    correspondía a todos los animales juntos (no solo a los de la tropa
 *    original) — hay que repartirlo entre las tropas del grupo.
 * 2. El despacho entrega cabezas sin anotar de qué tropa salió cada una —
 *    no se puede reconciliar cabezas vendidas contra compradas tropa por
 *    tropa, solo a nivel de grupo.
 *
 * Cada tropa (`Compra`) sigue existiendo como documento separado (su propio
 * DTE, proveedor, liquidación de compra y de faena) — el grupo es una
 * relación GUARDADA (no un cálculo al vuelo), y el rinde de despacho se
 * calcula y guarda UNA sola vez acá, no duplicado por tropa (ver
 * `Compra.grupoTropasId`: cada tropa del grupo lo hereda de acá, no calcula
 * el suyo propio).
 *
 * `pesoBrutoTotal`/`pesoNetoTotal` son el peso real del grupo completo
 * (repartido proporcional a las cabezas de cada tropa miembro al crear o
 * sumar una tropa al grupo — ver `use-cases/crear-grupo-tropas.use-case.ts`).
 *
 * `cerrado`/`fechaCierre`/`pesoFinalVentaTotal`/`rinde`/`alertaSuperavit` se
 * completan recién al cerrar el grupo (`use-cases/cerrar-grupo-tropas.use-case.ts`),
 * con el mismo criterio de reconciliación que `CerrarCompra` pero sumado
 * sobre TODAS las tropas del grupo.
 *
 * `alertaSuperavit`: si al cerrar las cabezas vendidas superan a las
 * compradas (típicamente falta un DTE por un animal adicional), no se
 * bloquea el cierre — se deja esta alerta visible para resolver después.
 * Un déficit (vendidas < compradas) sigue bloqueando el cierre, sin cambios.
 */
export interface GrupoTropas {
  id: string;
  empresaId: string;
  /** Nombre/código libre para identificar el grupo (ej. "Tropas 13-14") — opcional. */
  nombre: string | null;
  pesoBrutoTotal: number;
  pesoNetoTotal: number;
  cerrado: boolean;
  fechaCierre: Date | null;
  pesoFinalVentaTotal: number | null;
  rinde: number | null;
  alertaSuperavit: boolean;
  comentarios: string | null;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
