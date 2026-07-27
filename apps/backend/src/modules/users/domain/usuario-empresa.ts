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
}
