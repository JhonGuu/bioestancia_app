import { Roles } from "@/modules/users/domain/roles";

/**
 * Fila de la tabla puente `usuario_empresas`: el acceso de un usuario a una
 * empresa puntual, con el rol que tiene EN ESA empresa.
 *
 * Un mismo usuario puede tener varias filas (una por empresa), con roles
 * distintos en cada una. Ej: el contador tiene una fila por Bioestancia
 * (rol contable) y otra por El Meridiano (rol contable); la veterinaria
 * solo tiene una fila, por Bioestancia (rol veterinario).
 */
export interface UsuarioEmpresa {
  id: string;
  usuarioId: string;
  empresaId: string;
  rol: Roles;
  createdAt: Date;
}

/**
 * Empresa a la que un usuario tiene acceso, junto con el rol que tiene ahí.
 * Es lo que devuelve `GetMyEmpresas` — pensado para que el frontend arme el
 * selector de empresa después del login.
 */
export interface EmpresaAcceso {
  empresaId: string;
  razonSocial: string;
  rubro: string;
  rol: Roles;
  /**
   * Códigos de permiso granular del usuario en esta empresa (ver
   * `modules/permisos/domain/permiso.ts`). String[] genérico (no el enum
   * `Permisos`) para no acoplar el dominio de `users` al de `permisos` —
   * mismo criterio que `AuthContext`/`EmpresaAccess` en `shared/infra`.
   */
  permisos: string[];
}

/**
 * Un usuario con acceso a la empresa activa, junto con su rol ahí y sus
 * datos básicos — lo que necesita la pantalla "Usuarios" para armar la
 * tabla. Es la combinación de `User` (sin passwordHash) + `UsuarioEmpresa`.
 */
export interface UsuarioConAcceso {
  usuarioId: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  rol: Roles;
  /** Desde cuándo tiene acceso a esta empresa puntual. */
  accesoDesde: Date;
}
