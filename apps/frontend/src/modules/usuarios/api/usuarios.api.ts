import { httpClient, unwrap } from "@/shared/api/http-client";
import type { CrearUsuarioFormValues, EditarRolFormValues } from "@/modules/usuarios/domain/usuario.schemas";
import type { AccesoOtorgado, CrearUsuarioResult, UsuarioConAcceso } from "@/modules/usuarios/domain/usuario.types";

/**
 * `phoneNumber` vacío ("") no se manda — mismo criterio que `frigorificos.api.ts`.
 */
function cleanPayload<T extends Record<string, unknown>>(values: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== "") {
      cleaned[key as keyof T] = value as T[keyof T];
    }
  }
  return cleaned;
}

export const usuariosApi = {
  /** Usuarios con acceso a la empresa activa, con su rol. Admin-only. */
  list(): Promise<UsuarioConAcceso[]> {
    return unwrap(httpClient.get("/account/users"));
  },

  /** Crea un usuario nuevo + le otorga acceso a la empresa activa. La contraseña la genera el sistema. */
  create(input: CrearUsuarioFormValues): Promise<CrearUsuarioResult> {
    return unwrap(httpClient.post("/account/users", cleanPayload(input)));
  },

  /** Otorga acceso (o edita el rol, si ya tenía acceso) a un usuario buscado por email. */
  editarRol(input: EditarRolFormValues): Promise<AccesoOtorgado> {
    return unwrap(httpClient.post("/account/access", input));
  },

  setActivo(usuarioId: string, isActive: boolean): Promise<void> {
    return unwrap(httpClient.patch(`/account/users/${usuarioId}/estado`, { isActive }));
  },
};
