import { Roles } from "@/modules/users/domain/roles";
import { EmpresaAcceso, UsuarioEmpresa } from "@/modules/users/domain/usuario-empresa";

/**
 * Interface del repositorio de accesos usuario↔empresa. Forma parte del DOMINIO.
 *
 * Esta es la pieza central del modelo multi-empresa: todo endpoint que necesita
 * saber "¿puede este usuario operar esta empresa, y con qué rol?" pasa por acá.
 */
export interface UsuarioEmpresaRepository {
  /**
   * Busca el acceso de un usuario a una empresa puntual. Null si no tiene acceso.
   * Lo usa el middleware de auth para resolver el rol sobre la empresa activa
   * (header `X-Empresa-Id`) en cada request.
   */
  findAccess(usuarioId: string, empresaId: string): Promise<UsuarioEmpresa | null>;

  /**
   * Lista las empresas a las que un usuario tiene acceso, con su rol en cada una.
   * Lo usa `GetMyEmpresas` para armar el selector de empresa en el frontend.
   */
  listEmpresasForUsuario(usuarioId: string): Promise<EmpresaAcceso[]>;

  /**
   * Otorga (o actualiza, si ya existía) el acceso de un usuario a una empresa
   * con un rol determinado.
   */
  grantAccess(input: GrantAccessInput): Promise<UsuarioEmpresa>;

  /** Revoca el acceso de un usuario a una empresa. No falla si no existía. */
  revokeAccess(usuarioId: string, empresaId: string): Promise<void>;
}

export interface GrantAccessInput {
  usuarioId: string;
  empresaId: string;
  rol: Roles;
}
