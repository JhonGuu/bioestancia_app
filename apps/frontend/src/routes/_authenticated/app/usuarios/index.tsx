import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/modules/auth/context/auth-context";
import { Roles } from "@/modules/auth/domain/auth.types";
import { useUsuarios } from "@/modules/usuarios/hooks/use-usuarios";
import { UsuariosTable } from "@/modules/usuarios/components/usuarios-table";
import { CrearUsuarioDialog } from "@/modules/usuarios/components/crear-usuario-dialog";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/usuarios/")({
  component: UsuariosPage,
});

/**
 * Gestión de usuarios de la empresa activa — solo admin (mismo criterio que
 * `/app/empresa`: el nav item ya está oculto para no-admin, esto es la red
 * de contención si alguien entra a la URL a mano).
 */
function UsuariosPage() {
  const { user, empresaActiva } = useAuth();
  const usuariosQuery = useUsuarios();

  if (empresaActiva?.rol !== Roles.ADMIN) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Solo un administrador puede ver esta página.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-muted-foreground text-sm">
            Quiénes tienen acceso a esta empresa y con qué rol.
          </p>
        </div>
        <CrearUsuarioDialog />
      </div>

      <Card>
        <CardContent>
          {usuariosQuery.isPending ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Cargando usuarios...
            </div>
          ) : usuariosQuery.isError ? (
            <p className="text-destructive py-8 text-center text-sm">{usuariosQuery.error.message}</p>
          ) : (
            <UsuariosTable usuarios={usuariosQuery.data} usuarioActualId={user?.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
