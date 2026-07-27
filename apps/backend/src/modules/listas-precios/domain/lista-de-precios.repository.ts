import { ListaDePrecios } from "@/modules/listas-precios/domain/lista-de-precios";

/**
 * Interface del repositorio de Listas de Precios. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en `getById` y `list` — mismo motivo que en
 * `EmpresaRepository`/`ClienteRepository`: nunca se lee sin saber de qué
 * empresa es.
 */
export interface ListaDePreciosRepository {
  getById(id: string, empresaId: string): Promise<ListaDePrecios | null>;

  /** Lista las listas de precios activas de una empresa puntual. */
  list(empresaId: string): Promise<ListaDePrecios[]>;

  create(input: CreateListaDePreciosInput): Promise<ListaDePrecios>;
}

export interface CreateListaDePreciosInput {
  empresaId: string;
  nombre: string;
  descripcion?: string;
}
