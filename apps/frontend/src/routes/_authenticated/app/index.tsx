import { createFileRoute, redirect } from "@tanstack/react-router";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/")({
  // El operario no tiene nada que hacer en el dashboard genérico — lo manda
  // directo a cargar boletas, que es lo único que puede hacer.
  beforeLoad: ({ context }) => {
    if (context.auth.empresaActiva?.rol === Roles.OPERARIO) {
      throw redirect({ to: "/app/boletas" });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const auth = useAuth();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">
          Hola, {auth.user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          Estás operando <strong>{auth.empresaActiva?.razonSocial}</strong> como{" "}
          <span className="capitalize">{auth.empresaActiva?.rol}</span>.
        </p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Stack del frontend andando 🎉</CardTitle>
          <CardDescription>
            TanStack Router + TanStack Query + Axios + Zod + Tailwind + shadcn/ui,
            autenticado contra el backend real. Probá el módulo de Clientes en el
            menú de la izquierda.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
