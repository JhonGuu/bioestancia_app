import { httpClient, unwrap } from "@/shared/api/http-client";
import type {
  PlanificacionCabezasFila,
  UpsertPlanificacionCabezasInput,
} from "@/modules/planificacion-cabezas/domain/planificacion-cabezas.types";

export interface ListPlanificacionCabezasParams {
  desde: string;
  hasta: string;
  clienteId?: string;
}

export const planificacionCabezasApi = {
  list(params: ListPlanificacionCabezasParams): Promise<PlanificacionCabezasFila[]> {
    return unwrap(httpClient.get("/planificacion-cabezas", { params }));
  },

  /** Crea/actualiza el plan de un cliente para uno o más días (upsert por clienteId+fecha). */
  upsert(input: UpsertPlanificacionCabezasInput): Promise<unknown> {
    return unwrap(httpClient.post("/planificacion-cabezas", input));
  },
};
