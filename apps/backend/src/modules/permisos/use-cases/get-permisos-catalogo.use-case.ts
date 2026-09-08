import { injectable } from "inversify";

import { PERMISO_CATALOGO, PermisoCatalogoItem } from "@/modules/permisos/domain/permiso-catalogo";

/**
 * Devuelve el catálogo completo de permisos con su metadata (categoría,
 * etiqueta, descripción) — lo usa el frontend para pintar los checkboxes
 * agrupados del diálogo "Permisos", sin tener que duplicar esa metadata
 * en el cliente.
 */
@injectable()
export class GetPermisosCatalogo {
  execute(): PermisoCatalogoItem[] {
    return PERMISO_CATALOGO;
  }
}
