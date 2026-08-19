import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CreateCargoFormValues } from "@/modules/cargos/domain/cargo.schemas";
import type { Cargo } from "@/modules/cargos/domain/cargo.types";

function toPayload(input: CreateCargoFormValues) {
  return {
    nombre: input.nombre,
    toleranciaMinutos: input.toleranciaMinutos ? Number(input.toleranciaMinutos) : null,
  };
}

export type EstadoCargoFiltro = "activos" | "inactivos" | "todos";

export const cargosApi = {
  list(estado?: EstadoCargoFiltro): Promise<Cargo[]> {
    return unwrap(httpClient.get("/personal/cargos", { params: estado ? { estado } : undefined }));
  },

  getById(id: string): Promise<Cargo> {
    return unwrap(httpClient.get(`/personal/cargos/${id}`));
  },

  create(input: CreateCargoFormValues): Promise<Cargo> {
    return unwrap(httpClient.post("/personal/cargos", toPayload(input)));
  },

  update(id: string, input: CreateCargoFormValues): Promise<Cargo> {
    return unwrap(httpClient.patch(`/personal/cargos/${id}`, toPayload(input)));
  },

  remove(id: string): Promise<void> {
    return unwrap(httpClient.delete(`/personal/cargos/${id}`));
  },

  reactivar(id: string): Promise<Cargo> {
    return unwrap(httpClient.post(`/personal/cargos/${id}/reactivar`, {}));
  },
};
