type Listener = () => void;

const listeners = new Set<Listener>();

/**
 * Pub-sub mínimo para desacoplar el http-client (axios, sin acceso a React)
 * de `AuthProvider` (React). Cuando el server devuelve 401, el interceptor de
 * `http-client.ts` limpia la sesión y emite este evento; `AuthProvider` lo
 * escucha para resetear su estado y disparar el redirect a /login.
 */
export const AuthEvents = {
  onUnauthorized(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emitUnauthorized(): void {
    for (const listener of listeners) listener();
  },
};
