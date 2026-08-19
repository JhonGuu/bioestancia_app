import type { CompraCategoria } from "@/modules/compras/domain/compra.types";

/**
 * Espejo de `apps/backend/src/modules/resultado-faena/domain/resultado-faena.ts`.
 * 1 a 1 con una `Compra` — ver el comentario del backend para el detalle de
 * negocio (kgVivoTotal/kgCarneTotal/rendimiento se calculan en el server).
 */
export interface ResultadoFaena {
  id: string;
  compraId: string;
  frigorificoId: string | null;
  fechaFaena: string;
  numero: string | null;
  numeroAutorizacion: string | null;
  kgVivoTotal: number;
  kgCarneTotal: number;
  comisosKg: number;
  comisosCabezas: number;
  rendimiento: number;
  comentarios: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lo que devuelve `GET /compras/:compraId/resultado-faena` — el header + las líneas de categoría ya completadas con los datos de faena. */
export interface ResultadoFaenaConCategorias extends ResultadoFaena {
  categorias: CompraCategoria[];
}
