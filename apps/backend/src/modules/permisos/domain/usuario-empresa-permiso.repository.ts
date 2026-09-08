import { Permisos } from "@/modules/permisos/domain/permiso";

/**
 * Repositorio de permisos por acceso (fila de `usuario_empresas`).
 *
 * `setPermisos` reemplaza el set COMPLETO de permisos de ese acceso —igual
 * de simple que "editar rol" hace un update: la pantalla de administración
 * manda la lista final tildada, no altas/bajas incrementales.
 */
export interface UsuarioEmpresaPermisoRepository {
  /** Permisos vigentes de un acceso (usuario+empresa) puntual. */
  getPermisos(usuarioEmpresaId: string): Promise<Permisos[]>;

  /** Reemplaza el set completo de permisos de ese acceso por el recibido. */
  setPermisos(usuarioEmpresaId: string, permisos: Permisos[]): Promise<void>;
}
