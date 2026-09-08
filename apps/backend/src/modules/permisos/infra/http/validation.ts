import { injectable } from "inversify";
import { z } from "zod";

import { Permisos } from "@/modules/permisos/domain/permiso";

/** Schemas Zod para los endpoints del módulo permisos. */
@injectable()
export class PermisoValidation {
  /** Reemplaza el set completo de permisos de un usuario (por email) en la empresa activa. */
  setPermisos = {
    body: z.object({
      email: z.string().email("Email inválido"),
      permisos: z.array(z.nativeEnum(Permisos)),
    }),
  };

  getPermisosUsuario = {
    params: z.object({ usuarioId: z.string().uuid() }),
  };
}
