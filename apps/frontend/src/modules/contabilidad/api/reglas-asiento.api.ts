import { httpClient, unwrap } from "@/shared/api/http-client";
import type { EventoAsientoInfo, LadoLineaRegla, ReglaAsiento } from "@/modules/contabilidad/domain/regla-asiento.types";

export interface ReglaAsientoLineaInput {
  lado: LadoLineaRegla;
  cuentaId: string;
  expresion: string;
  auxiliarResolver?: string | null;
}

export interface CrearReglaAsientoInput {
  evento: string;
  nombre: string;
  activa?: boolean;
  prioridad?: number;
  condicion?: Record<string, string> | null;
  lineas: ReglaAsientoLineaInput[];
}

export interface ActualizarReglaAsientoInput {
  nombre?: string;
  activa?: boolean;
  prioridad?: number;
  condicion?: Record<string, string> | null;
  lineas?: ReglaAsientoLineaInput[];
}

export const reglasAsientoApi = {
  /** Catálogo de eventos con sus expresiones/auxiliares válidos — alimenta el form de reglas. */
  listEventos(): Promise<EventoAsientoInfo[]> {
    return unwrap(httpClient.get("/contabilidad/reglas-asiento/eventos"));
  },

  list(): Promise<ReglaAsiento[]> {
    return unwrap(httpClient.get("/contabilidad/reglas-asiento"));
  },

  create(input: CrearReglaAsientoInput): Promise<ReglaAsiento> {
    return unwrap(httpClient.post("/contabilidad/reglas-asiento", input));
  },

  update(id: string, input: ActualizarReglaAsientoInput): Promise<ReglaAsiento> {
    return unwrap(httpClient.patch(`/contabilidad/reglas-asiento/${id}`, input));
  },

  remove(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/contabilidad/reglas-asiento/${id}`));
  },
};
