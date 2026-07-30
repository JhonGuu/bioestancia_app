import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import { AuthProvider, useAuth } from "@/modules/auth/context/auth-context";
import { ThemeProvider } from "@/shared/theme/theme-provider";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createRouter({
  routeTree,
  // Se completa en runtime en <InnerApp/> con el valor real de useAuth().
  context: { auth: undefined! },
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * Puente entre el estado de auth (React) y el router (framework-agnostic):
 * cada vez que `auth` cambia, `RouterProvider` re-evalúa los `beforeLoad` de
 * las rutas activas con el contexto actualizado.
 *
 * Mientras la sesión se está hidratando (`status === "loading"`, ver
 * `auth-context.tsx`) ni siquiera montamos el router — así ninguna ruta ve
 * nunca un estado de auth a medio resolver.
 */
function InnerApp() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground text-sm">
        Cargando...
      </div>
    );
  }

  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
