import { httpClient, unwrap } from "@/shared/api/http-client";
import type { Jornada } from "@/modules/jornadas/domain/jornada.types";

export const jornadasApi = {
  /** `desde`/`hasta` en formato "YYYY-MM-DD" (inclusive). */
  calcular(empleadoId: string, desde: string, hasta: string): Promise<Jornada[]> {
    return unwrap(
      httpClient.get(`/personal/empleados/${empleadoId}/jornadas`, { params: { desde, hasta } }),
    );
  },
};
