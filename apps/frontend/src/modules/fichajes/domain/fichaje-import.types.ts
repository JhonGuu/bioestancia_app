/** Espejo de `apps/backend/src/modules/personal/domain/fichaje.ts`. */
export const TipoFichaje = {
  ENTRADA: "entrada",
  SALIDA: "salida",
} as const;
export type TipoFichaje = (typeof TipoFichaje)[keyof typeof TipoFichaje];

/** Espejo de `apps/backend/src/modules/personal/domain/fichaje-import.ts`. */
export interface FilaFichajeMatcheada {
  empleadoId: string;
  empleadoNombre: string;
  momento: string;
  tipo: TipoFichaje;
}

export interface GrupoFichajeSinMatch {
  nombreDispositivo: string;
  cantidad: number;
  primerMomento: string;
  filas: { momento: string; tipo: TipoFichaje }[];
}

export interface PreviewImportacionFichajes {
  totalFilas: number;
  filasConError: number;
  duplicadosDescartados: number;
  matcheadas: FilaFichajeMatcheada[];
  sinMatch: GrupoFichajeSinMatch[];
}

export interface FilaFichajeConfirmar {
  empleadoId: string;
  momento: string;
  tipo: TipoFichaje;
}

export interface AliasDispositivoConfirmar {
  empleadoId: string;
  nombreDispositivo: string;
}

export interface ResultadoConfirmarImportacion {
  importados: number;
  omitidosPorDuplicado: number;
}
