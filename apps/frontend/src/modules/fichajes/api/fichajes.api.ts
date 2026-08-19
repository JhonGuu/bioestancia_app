import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  AliasDispositivoConfirmar,
  FilaFichajeConfirmar,
  PreviewImportacionFichajes,
  ResultadoConfirmarImportacion,
  TipoFichaje,
} from "@/modules/fichajes/domain/fichaje-import.types";
import type { FichajeCrudo } from "@/modules/jornadas/domain/jornada.types";

export const fichajesApi = {
  /** Primer paso: sube el Excel del lector de huellas, no escribe nada todavía. */
  previsualizarImportacion(archivo: File): Promise<PreviewImportacionFichajes> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    return unwrap(
      httpClient.post("/personal/fichajes/importar/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  /** Segundo paso: inserta las filas ya resueltas (matcheadas + asignadas a mano). */
  confirmarImportacion(
    filas: FilaFichajeConfirmar[],
    alias?: AliasDispositivoConfirmar[],
  ): Promise<ResultadoConfirmarImportacion> {
    return unwrap(httpClient.post("/personal/fichajes/importar/confirmar", { filas, alias }));
  },

  /** Carga manual de una marcación puntual (olvido de fichar, corrección, etc). */
  agregarManual(empleadoId: string, momento: string, tipo: TipoFichaje): Promise<FichajeCrudo> {
    return unwrap(httpClient.post("/personal/fichajes/manual", { empleadoId, momento, tipo }));
  },
};
