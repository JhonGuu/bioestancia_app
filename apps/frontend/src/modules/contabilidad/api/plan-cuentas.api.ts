import { httpClient, unwrap } from "@/shared/api/http-client";
import type { Cuenta } from "@/modules/contabilidad/domain/cuenta.types";
import type { CuentaPayload } from "@/modules/contabilidad/domain/cuenta.schemas";

function cleanPayload<T extends Record<string, unknown>>(values: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== "") cleaned[key as keyof T] = value as T[keyof T];
  }
  return cleaned;
}

export interface PlanDeCuentas {
  arbol: unknown; // se reconstruye en el cliente con `construirArbolCuentas`, no hace falta tipar el árbol del backend
  cuentas: Cuenta[];
}

export const planCuentasApi = {
  list(): Promise<{ cuentas: Cuenta[] }> {
    return unwrap(httpClient.get("/contabilidad/plan-cuentas"));
  },

  sembrar(forzar: boolean): Promise<{ creadas: number; omitidas: number }> {
    return unwrap(httpClient.post("/contabilidad/plan-cuentas/sembrar", { forzar }));
  },

  create(input: CuentaPayload): Promise<Cuenta> {
    return unwrap(httpClient.post("/contabilidad/plan-cuentas", cleanPayload(input)));
  },

  update(id: string, input: Partial<CuentaPayload> & { activa?: boolean }): Promise<Cuenta> {
    return unwrap(httpClient.patch(`/contabilidad/plan-cuentas/${id}`, cleanPayload(input)));
  },

  remove(id: string): Promise<{ eliminada: boolean; mensaje: string }> {
    return unwrap(httpClient.delete(`/contabilidad/plan-cuentas/${id}`));
  },
};
