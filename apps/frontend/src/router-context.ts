import type { AuthContextValue } from "@/modules/auth/context/auth-context";

/**
 * Contexto disponible en `beforeLoad`/`loader` de cualquier ruta. Se completa
 * en runtime con el valor real de `useAuth()` (ver `main.tsx`) — así las
 * rutas pueden redirigir según el estado de auth sin acoplarse a React.
 */
export interface RouterContext {
  auth: AuthContextValue;
}
