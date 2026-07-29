/**
 * Persistencia de sesión en localStorage.
 *
 * Solo guarda los dos valores que el http-client necesita leer de forma
 * síncrona en cada request (token JWT + empresa activa, ver
 * `shared/api/http-client.ts`). El resto del estado de sesión (usuario,
 * empresas disponibles) vive en memoria, en `AuthProvider`, y se repuebla
 * llamando a `/account/me` y `/account/empresas` al cargar la app.
 */
const TOKEN_KEY = "bioestancia:token";
const EMPRESA_ID_KEY = "bioestancia:empresaId";

export const SessionStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getEmpresaId(): string | null {
    return localStorage.getItem(EMPRESA_ID_KEY);
  },
  setEmpresaId(empresaId: string): void {
    localStorage.setItem(EMPRESA_ID_KEY, empresaId);
  },
  clearEmpresaId(): void {
    localStorage.removeItem(EMPRESA_ID_KEY);
  },

  /** Cierra la sesión completa: token + empresa activa. */
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMPRESA_ID_KEY);
  },
};
