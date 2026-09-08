import { httpClient, unwrap } from "@/shared/api/http-client";
import type { LibroDiario, MayorCuenta, SumasYSaldos } from "@/modules/contabilidad/domain/reportes.types";
import type { ListarAsientosFiltros } from "@/modules/contabilidad/api/asientos.api";

export interface LibroDiarioFiltros extends ListarAsientosFiltros {
  incluirBorradores?: boolean;
}

export interface MayorCuentaFiltros {
  cuentaId: string;
  desde?: string;
  hasta?: string;
  auxiliarId?: string;
}

export interface SumasYSaldosFiltros {
  ejercicioId?: string;
  desde?: string;
  hasta?: string;
}

export const reportesContablesApi = {
  libroDiario(filtros: LibroDiarioFiltros): Promise<LibroDiario> {
    return unwrap(httpClient.get("/contabilidad/reportes/diario", { params: filtros }));
  },

  mayorCuenta(filtros: MayorCuentaFiltros): Promise<MayorCuenta> {
    return unwrap(httpClient.get("/contabilidad/reportes/mayor", { params: filtros }));
  },

  sumasYSaldos(filtros: SumasYSaldosFiltros): Promise<SumasYSaldos> {
    return unwrap(httpClient.get("/contabilidad/reportes/sumas-y-saldos", { params: filtros }));
  },
};
