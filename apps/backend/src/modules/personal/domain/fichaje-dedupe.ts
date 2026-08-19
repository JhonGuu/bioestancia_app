/**
 * Ventana de tolerancia para considerar dos marcaciones "la misma" — cubre
 * tanto los dobles-toque a segundos de diferencia que manda el lector
 * (ver `docs/plan-personal-asistencia.md`, relevamiento del Excel) como un
 * reintento de importar el mismo archivo dos veces.
 */
export const DEDUPE_VENTANA_MINUTOS = 5;

export interface MarcacionParaDedupe {
  /** Clave de agrupamiento — ej. `${empleadoId}:${tipo}` o `${nombreCrudo}:${tipo}`. */
  grupo: string;
  momento: Date;
  /** `true` si ya está persistida en la base — nunca se descarta a sí misma, solo sirve de referencia. */
  esExistente: boolean;
}

/**
 * Descarta, dentro de cada `grupo`, las marcaciones nuevas que caen a menos
 * de `DEDUPE_VENTANA_MINUTOS` de la marcación aceptada más cercana (ya sea
 * una marcación existente en la base o una nueva ya aceptada antes en la
 * misma pasada, en orden cronológico). Las marcaciones `esExistente` nunca
 * se descartan — son la verdad ya persistida, solo actúan como referencia.
 */
export function filtrarDuplicados<T extends MarcacionParaDedupe>(
  items: T[],
): { conservadas: T[]; descartadas: T[] } {
  const porGrupo = new Map<string, T[]>();
  for (const item of items) {
    const lista = porGrupo.get(item.grupo) ?? [];
    lista.push(item);
    porGrupo.set(item.grupo, lista);
  }

  const conservadas: T[] = [];
  const descartadas: T[] = [];
  const ventanaMs = DEDUPE_VENTANA_MINUTOS * 60 * 1000;

  for (const lista of porGrupo.values()) {
    const ordenada = [...lista].sort((a, b) => a.momento.getTime() - b.momento.getTime());
    let ultimoAceptado: Date | null = null;

    for (const item of ordenada) {
      if (item.esExistente) {
        conservadas.push(item);
        ultimoAceptado = item.momento;
        continue;
      }
      if (ultimoAceptado && Math.abs(item.momento.getTime() - ultimoAceptado.getTime()) < ventanaMs) {
        descartadas.push(item);
        continue;
      }
      conservadas.push(item);
      ultimoAceptado = item.momento;
    }
  }

  return { conservadas, descartadas };
}
