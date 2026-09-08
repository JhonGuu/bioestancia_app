/**
 * Espejo de `shared/infra/http/pagination.ts` del backend.
 * Un endpoint paginado devuelve `data: PaginatedResult<T>` dentro del sobre
 * estándar `{ status, message, data }`.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Tamaños de página que ofrece el selector — espejo de `PAGE_SIZES` del backend. */
export const PAGE_SIZES = [20, 50, 100, 200, 500] as const;
