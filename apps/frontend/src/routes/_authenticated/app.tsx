import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/shared/components/app-shell";

/**
 * Segundo nivel de guard: requiere sesión (heredado de `_authenticated`) Y
 * empresa activa seleccionada. Si no hay empresa, manda al selector.
 */
export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: ({ context }) => {
    if (!context.auth.empresaActiva) {
      throw redirect({ to: "/empresas" });
    }
  },
  component: AppShell,
});
