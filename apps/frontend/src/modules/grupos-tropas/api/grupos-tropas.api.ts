import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  CrearGrupoTropasInput,
  GrupoTropas,
  GrupoTropasConMiembros,
} from "@/modules/grupos-tropas/domain/grupo-tropas.types";

export const gruposTropasApi = {
  list(): Promise<GrupoTropas[]> {
    return unwrap(httpClient.get("/grupos-tropas"));
  },

  getById(id: string): Promise<GrupoTropasConMiembros> {
    return unwrap(httpClient.get(`/grupos-tropas/${id}`));
  },

  crear(input: CrearGrupoTropasInput): Promise<GrupoTropasConMiembros> {
    return unwrap(httpClient.post("/grupos-tropas", input));
  },

  /** Reconcilia cabezas vendidas contra compradas SUMADAS de todas las tropas del grupo y calcula el rinde. */
  cerrar(id: string): Promise<GrupoTropasConMiembros> {
    return unwrap(httpClient.post(`/grupos-tropas/${id}/cerrar`));
  },

  /** Deshace el cierre del grupo y de todas sus tropas miembro. */
  reabrir(id: string): Promise<GrupoTropasConMiembros> {
    return unwrap(httpClient.post(`/grupos-tropas/${id}/reabrir`));
  },
};
