import { z } from "zod";

export const PAGE_SIZES = [20, 50, 100, 200, 500] as const;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500, "El máximo por página es 500").default(50),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const optionalPaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500, "El máximo por página es 500").optional(),
});

export type OptionalPaginationQuery = z.infer<typeof optionalPaginationQuerySchema>;

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

export function buildPaginationMeta(query: PaginationQuery, total: number): PaginationMeta {
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}
