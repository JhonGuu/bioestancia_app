import { TipoFichaje } from "@/modules/personal/domain/fichaje";

/** Una marcación del Excel que se pudo matchear automáticamente contra un `Empleado.nombreDispositivo`. */
export interface FilaFichajeMatcheada {
  empleadoId: string;
  empleadoNombre: string;
  momento: Date;
  tipo: TipoFichaje;
}

/** Marcaciones agrupadas bajo un nombre del dispositivo que no matcheó ningún empleado — requiere resolución manual. */
export interface GrupoFichajeSinMatch {
  nombreDispositivo: string;
  cantidad: number;
  primerMomento: Date;
  filas: { momento: Date; tipo: TipoFichaje }[];
}

export interface PreviewImportacionFichajes {
  totalFilas: number;
  filasConError: number;
  duplicadosDescartados: number;
  matcheadas: FilaFichajeMatcheada[];
  sinMatch: GrupoFichajeSinMatch[];
}

/** Una fila ya resuelta (matcheada de entrada, o asignada a mano) lista para insertar. */
export interface FilaFichajeConfirmar {
  empleadoId: string;
  momento: Date;
  tipo: TipoFichaje;
}

/** Si se resolvió un nombre sin match a mano, opcionalmente se guarda el alias para la próxima importación. */
export interface AliasDispositivoConfirmar {
  empleadoId: string;
  nombreDispositivo: string;
}

export interface ResultadoConfirmarImportacion {
  importados: number;
  omitidosPorDuplicado: number;
}
