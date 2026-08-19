import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { useAuth } from "@/modules/auth/context/auth-context";
import { ForcedChangePasswordScreen } from "@/modules/auth/components/forced-change-password-screen";

/**
 * Layout "pathless" (el `_` inicial no agrega segmento a la URL): agrupa
 * toda ruta que requiere sesión. Ver `/app` para el segundo nivel de guard
 * (requiere además una empresa activa seleccionada).
 *
 * Si el usuario tiene `mustChangePassword` (contraseña temporal, primer
 * login) queda bloqueado acá — ni siquiera llega al selector de empresa —
 * hasta que la cambie (ver `ForcedChangePasswordScreen`).
 */
export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (context.auth.status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedGate,
});

function AuthenticatedGate() {
  const { user } = useAuth();
  if (user?.mustChangePassword) {
    return <ForcedChangePasswordScreen />;
  }
  return <Outlet />;
}
