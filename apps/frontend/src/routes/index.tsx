import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * "/" nunca renderiza nada — solo decide a dónde mandar según el estado de
 * sesión. `main.tsx` no monta el router hasta que `auth.status` deja de ser
 * "loading", así que acá siempre es "authenticated" o "unauthenticated".
 */
export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.auth.status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
    if (!context.auth.empresaActiva) {
      throw redirect({ to: "/empresas" });
    }
    throw redirect({ to: "/app" });
  },
});
