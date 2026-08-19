import { httpClient, unwrap } from "@/shared/api/http-client";
import type { Cheque, EstadoCheque } from "@/modules/cheques/domain/cheque.types";
import type {
  CargoCuentaCorriente,
  ResultadoConfirmarRechazoCheque,
  SugerenciaRecargoCheque,
  SugerenciaReversionChequeRechazado,
} from "@/modules/cheques/domain/cargo-cheque.types";

export interface ListChequesFiltro {
  estado?: EstadoCheque;
  clienteId?: string;
}

export const chequesApi = {
  list(filtro?: ListChequesFiltro): Promise<Cheque[]> {
    return unwrap(httpClient.get("/cheques", { params: filtro }));
  },

  getById(id: string): Promise<Cheque> {
    return unwrap(httpClient.get(`/cheques/${id}`));
  },

  actualizarEstado(
    id: string,
    estado: EstadoCheque,
    extra?: { motivoRechazo?: string; endosadoA?: string; fechaEndoso?: string },
  ): Promise<Cheque> {
    return unwrap(httpClient.patch(`/cheques/${id}/estado`, { estado, ...extra }));
  },

  // Las 4 acciones de recargo/rechazo viven bajo /cobros en el backend (ver comentario en cargo-cheque.types.ts).
  sugerenciaRecargo(chequeId: string): Promise<SugerenciaRecargoCheque> {
    return unwrap(httpClient.get(`/cobros/cheques/${chequeId}/sugerencia-recargo`));
  },

  confirmarRecargo(chequeId: string, monto?: number): Promise<CargoCuentaCorriente> {
    return unwrap(httpClient.post(`/cobros/cheques/${chequeId}/confirmar-recargo`, { monto }));
  },

  sugerenciaRechazo(chequeId: string): Promise<SugerenciaReversionChequeRechazado> {
    return unwrap(httpClient.get(`/cobros/cheques/${chequeId}/sugerencia-rechazo`));
  },

  confirmarRechazo(
    chequeId: string,
    comision?: number,
    sinComision?: boolean,
  ): Promise<ResultadoConfirmarRechazoCheque> {
    return unwrap(httpClient.post(`/cobros/cheques/${chequeId}/confirmar-rechazo`, { comision, sinComision }));
  },
};
