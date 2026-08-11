import axios, { AxiosError } from "axios";

import { Env } from "@/shared/config/env";
import { SessionStorage } from "@/shared/auth/session-storage";
import { AuthEvents } from "@/shared/auth/auth-events";
import { ApiError, type ApiErrorBody, type ApiSuccessBody } from "@/shared/api/api-response";

/**
 * Instancia central de Axios. Es el único punto del frontend que sabe hablar
 * HTTP con el backend — todo módulo de negocio pasa por acá vía su propio
 * `<modulo>.api.ts` (capa "infra" del lado del cliente).
 */
export const httpClient = axios.create({
  baseURL: Env.apiUrl,
});

// Request: adjunta JWT + empresa activa en cada llamada, igual que espera
// `ExpressAdapter.buildAuthMiddleware` en el backend.
httpClient.interceptors.request.use((config) => {
  const token = SessionStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const empresaId = SessionStorage.getEmpresaId();
  if (empresaId) {
    config.headers["X-Empresa-Id"] = empresaId;
  }

  return config;
});

// Response: desenvuelve `{ data }` en éxito, normaliza errores a `ApiError` en falla.
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const { status } = error.response;
      let { data } = error.response;

      // Los endpoints de descarga (PDF/Excel) piden `responseType: "blob"` —
      // si esa misma request falla, el error también llega como Blob (no
      // como el JSON de `ApiErrorBody`) y hay que parsearlo a mano.
      if (data instanceof Blob && data.type.includes("json")) {
        data = JSON.parse(await data.text());
      }

      // El backend limpia el token del lado del cliente forzando logout ante 401.
      if (status === 401) {
        SessionStorage.clear();
        AuthEvents.emitUnauthorized();
      }

      return Promise.reject(new ApiError(data ?? {}, status));
    }

    // Sin respuesta del server: timeout, backend caído, CORS, etc.
    return Promise.reject(
      new ApiError({ message: "No se pudo conectar con el servidor" }, 0),
    );
  },
);

/** Helper para tipar la respuesta ya desenvuelta de un endpoint. */
export async function unwrap<T>(promise: Promise<{ data: ApiSuccessBody<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}
