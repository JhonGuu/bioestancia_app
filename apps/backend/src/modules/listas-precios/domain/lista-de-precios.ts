/**
 * Representación de una Lista de Precios en el dominio.
 *
 * Por ahora es solo el "encabezado" (nombre + a qué empresa pertenece).
 * Los ítems (qué precio tiene cada producto en esta lista) van a necesitar
 * un módulo de catálogo/productos que todavía no existe — cuando lo armes,
 * sumá una tabla `lista_de_precios_items` con `listaDePreciosId` + `productoId`
 * + `precio`, en vez de meter los precios acá.
 */
export interface ListaDePrecios {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  createdAt: Date;
  updatedAt: Date;
}
