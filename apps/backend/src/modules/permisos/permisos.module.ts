import { Container } from "inversify";

import { DI_TYPES } from "@/shared/infra/di/types";
import { PermisoController } from "@/modules/permisos/infra/http/permiso.controller";
import { PermisoValidation } from "@/modules/permisos/infra/http/validation";
import { SetPermisosUsuario } from "@/modules/permisos/use-cases/set-permisos-usuario.use-case";
import { GetPermisosUsuario } from "@/modules/permisos/use-cases/get-permisos-usuario.use-case";
import { GetPermisosCatalogo } from "@/modules/permisos/use-cases/get-permisos-catalogo.use-case";

/**
 * Registra las dependencias del módulo `permisos`.
 *
 * OJO: `UsuarioEmpresaPermisoRepository` NO se bindea acá — se bindea suelto
 * en `di.ts`, ANTES de `registerUsersModule()`, porque `UsersAuthProvider`
 * (dentro de `users`) también lo necesita y se instancia eager antes de que
 * este archivo llegue a correr (ver el comentario largo en `di.ts` al lado
 * de ese bind, mismo patrón que ya usan con `CobroRepository`).
 *
 * Lo que sí se bindea acá son los use-cases y el controller — los use-cases
 * dependen de `UserRepository`/`UsuarioEmpresaRepository` (del módulo
 * `users`) para resolver el acceso al que cuelgan los permisos, por eso
 * `registerPermisosModule()` tiene que llamarse DESPUÉS de
 * `registerUsersModule()` en `di.ts`.
 */
export function registerPermisosModule(container: Container): void {
  // Validations
  container.bind(DI_TYPES.PermisoValidation).to(PermisoValidation);

  // Use-cases
  container.bind(DI_TYPES.SetPermisosUsuario).to(SetPermisosUsuario);
  container.bind(DI_TYPES.GetPermisosUsuario).to(GetPermisosUsuario);
  container.bind(DI_TYPES.GetPermisosCatalogo).to(GetPermisosCatalogo);

  // Controller (instanciado eagerly para que registre rutas en el HttpServer)
  container.bind(DI_TYPES.PermisoController).to(PermisoController);
  container.get(DI_TYPES.PermisoController);
}
