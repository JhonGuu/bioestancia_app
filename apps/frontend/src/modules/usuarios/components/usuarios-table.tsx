import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROL_LABELS } from "@/modules/usuarios/domain/rol-labels";
import { EditarRolDialog } from "@/modules/usuarios/components/editar-rol-dialog";
import { PermisosUsuarioDialog } from "@/modules/usuarios/components/permisos-usuario-dialog";
import { DesactivarUsuarioDialog } from "@/modules/usuarios/components/desactivar-usuario-dialog";
import { ActivarUsuarioButton } from "@/modules/usuarios/components/activar-usuario-button";
import type { UsuarioConAcceso } from "@/modules/usuarios/domain/usuario.types";

interface UsuariosTableProps {
  usuarios: UsuarioConAcceso[];
  /** El propio usuario logueado no puede desactivarse a sí mismo — mismo criterio que el backend. */
  usuarioActualId?: string;
}

export function UsuariosTable({ usuarios, usuarioActualId }: UsuariosTableProps) {
  if (usuarios.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Todavía no hay usuarios con acceso a esta empresa.
      </p>
    );
  }

  return (
    <>
      {/* Desktop: tabla. Mobile: tarjetas apiladas (mismo criterio que Frigoríficos/Proveedores). */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.usuarioId}>
                <TableCell className="font-medium">
                  {usuario.firstName} {usuario.lastName}
                  {usuario.usuarioId === usuarioActualId && (
                    <span className="text-muted-foreground ml-1 text-xs">(vos)</span>
                  )}
                </TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>{ROL_LABELS[usuario.rol]}</TableCell>
                <TableCell>
                  <EstadoBadges usuario={usuario} />
                </TableCell>
                <TableCell className="text-right">
                  <Acciones usuario={usuario} usuarioActualId={usuarioActualId} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 sm:hidden">
        {usuarios.map((usuario) => (
          <div key={usuario.usuarioId} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {usuario.firstName} {usuario.lastName}
                  {usuario.usuarioId === usuarioActualId && (
                    <span className="text-muted-foreground ml-1 text-xs">(vos)</span>
                  )}
                </p>
                <p className="text-muted-foreground truncate text-xs">{usuario.email}</p>
              </div>
              <Acciones usuario={usuario} usuarioActualId={usuarioActualId} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <Badge variant="outline">{ROL_LABELS[usuario.rol]}</Badge>
              <EstadoBadges usuario={usuario} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EstadoBadges({ usuario }: { usuario: UsuarioConAcceso }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={usuario.isActive ? "default" : "secondary"}>
        {usuario.isActive ? "Activo" : "Inactivo"}
      </Badge>
      {usuario.mustChangePassword && <Badge variant="outline">Primer login pendiente</Badge>}
    </div>
  );
}

function Acciones({
  usuario,
  usuarioActualId,
}: {
  usuario: UsuarioConAcceso;
  usuarioActualId?: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <EditarRolDialog usuario={usuario} />
      <PermisosUsuarioDialog usuario={usuario} />
      {usuario.usuarioId === usuarioActualId ? null : usuario.isActive ? (
        <DesactivarUsuarioDialog
          usuarioId={usuario.usuarioId}
          nombre={`${usuario.firstName} ${usuario.lastName}`}
        />
      ) : (
        <ActivarUsuarioButton usuarioId={usuario.usuarioId} />
      )}
    </div>
  );
}
