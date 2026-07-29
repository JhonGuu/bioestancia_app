import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/**
 * Layout "pathless" (el `_` inicial no agrega segmento a la URL): agrupa
 * toda ruta que requiere sesión. Ver `/app` para el segundo nivel de guard
 * (requiere además una empresa activa seleccionada).
 */
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (context.auth.status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
