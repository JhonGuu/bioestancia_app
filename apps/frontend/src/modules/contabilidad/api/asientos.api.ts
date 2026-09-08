import { httpClient, unwrap } from "@/shared/api/http-client";
import type { Asiento, EstadoAsiento, RespaldoAsiento, TipoAsiento } from "@/modules/contabilidad/domain/asiento.types";
import type { AsientoFormValues } from "@/modules/contabilidad/domain/asiento.schemas";
import type { TipoAuxiliar } from "@/modules/contabilidad/domain/tipo-auxiliar";

export interface ListarAsientosFiltros {
  ejercicioId?: string;
  periodoId?: string;
  desde?: string;
  hasta?: string;
  tipo?: TipoAsiento;
  estado?: EstadoAsiento;
  respaldo?: RespaldoAsiento;
  cuentaId?: string;
}

function limpiarLineas(lineas: AsientoFormValues["lineas"]) {
  return lineas.map((linea) => ({
    cuentaId: linea.cuentaId,
    debe: linea.debe || 0,
    haber: linea.haber || 0,
    detalle: linea.detalle || undefined,
    auxiliarTipo: linea.auxiliarTipo || undefined,
    auxiliarId: linea.auxiliarId || undefined,
    centroCostoId: linea.centroCostoId || undefined,
  }));
}

export interface SaldoInicialInput {
  cuentaId: string;
  importe: number;
  auxiliarTipo?: TipoAuxiliar;
  auxiliarId?: string;
  detalle?: string;
}

export interface GenerarAperturaInput {
  ejercicioId: string;
  fecha?: string;
  descripcion?: string;
  cuentaAjusteId?: string;
  confirmar?: boolean;
  saldos: SaldoInicialInput[];
}

export const asientosApi = {
  list(filtros: ListarAsientosFiltros): Promise<Asiento[]> {
    return unwrap(httpClient.get("/contabilidad/asientos", { params: filtros }));
  },

  getById(id: string): Promise<Asiento> {
    return unwrap(httpClient.get(`/contabilidad/asientos/${id}`));
  },

  create(input: AsientoFormValues & { confirmar?: boolean }): Promise<Asiento> {
    return unwrap(
      httpClient.post("/contabilidad/asientos", {
        fecha: input.fecha,
        descripcion: input.descripcion,
        tipo: input.tipo || undefined,
        respaldo: input.respaldo || undefined,
        confirmar: input.confirmar ?? false,
        lineas: limpiarLineas(input.lineas),
      }),
    );
  },

  update(id: string, input: Partial<AsientoFormValues>): Promise<Asiento> {
    return unwrap(
      httpClient.patch(`/contabilidad/asientos/${id}`, {
        fecha: input.fecha,
        descripcion: input.descripcion,
        respaldo: input.respaldo || undefined,
        lineas: input.lineas ? limpiarLineas(input.lineas) : undefined,
      }),
    );
  },

  confirmar(id: string): Promise<Asiento> {
    return unwrap(httpClient.post(`/contabilidad/asientos/${id}/confirmar`, {}));
  },

  anular(id: string): Promise<{ asiento: Asiento | null; eliminado: boolean; mensaje: string }> {
    return unwrap(httpClient.delete(`/contabilidad/asientos/${id}`));
  },

  generarApertura(input: GenerarAperturaInput): Promise<Asiento> {
    return unwrap(httpClient.post("/contabilidad/asientos/apertura", input));
  },
};
