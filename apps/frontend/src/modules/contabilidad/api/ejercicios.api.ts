import { httpClient, unwrap } from "@/shared/api/http-client";
import type { EstadoEjercicio, EstadoPeriodo, EjercicioConPeriodos, Periodo } from "@/modules/contabilidad/domain/ejercicio.types";
import type { EjercicioFormValues } from "@/modules/contabilidad/domain/ejercicio.schemas";
import type { Ejercicio } from "@/modules/contabilidad/domain/ejercicio.types";

export const ejerciciosApi = {
  list(): Promise<EjercicioConPeriodos[]> {
    return unwrap(httpClient.get("/contabilidad/ejercicios"));
  },

  create(input: EjercicioFormValues): Promise<Ejercicio> {
    return unwrap(
      httpClient.post("/contabilidad/ejercicios", {
        nombre: input.nombre || undefined,
        fechaInicio: input.fechaInicio,
        fechaFin: input.fechaFin,
      }),
    );
  },

  cambiarEstadoEjercicio(id: string, estado: EstadoEjercicio): Promise<Ejercicio> {
    return unwrap(httpClient.patch(`/contabilidad/ejercicios/${id}/estado`, { estado }));
  },

  cambiarEstadoPeriodo(id: string, estado: EstadoPeriodo): Promise<Periodo> {
    return unwrap(httpClient.patch(`/contabilidad/periodos/${id}/estado`, { estado }));
  },
};
