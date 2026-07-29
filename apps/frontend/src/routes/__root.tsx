import {
  createRootRouteWithContext,
  Link,
  Outlet,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import type { RouterContext } from "@/router-context";

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: RootErrorComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && (
        <>
          <TanStackRouterDevtools position="bottom-right" />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </>
  );
}

/**
 * Fallback de último recurso para cualquier error de render no manejado.
 *
 * La causa más común en la práctica no es un bug de la app: es la
 * traducción automática del navegador (Chrome/Edge) reescribiendo el DOM
 * por fuera de React y rompiendo los portales de Radix (Select, Dialog) con
 * "Failed to execute 'removeChild' on 'Node'" — bug conocido, no nuestro
 * (radix-ui/primitives#2578). Ya deshabilitamos la traducción automática en
 * `index.html`; esto es la red de contención para cualquier otro caso.
 */
function RootErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4 text-center">
      <div>
        <h1 className="text-lg font-semibold">Algo salió mal</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          {error instanceof Error ? error.message : "Ocurrió un error inesperado."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
