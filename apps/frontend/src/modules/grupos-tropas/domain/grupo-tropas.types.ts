import type { Compra } from "@/modules/compras/domain/compra.types";

/**
 * Espejo de `apps/backend/src/modules/grupos-tropas/domain/grupo-tropas.ts`.
 * Ver `plan-unificacion-tropas-despacho.md` para el problema de negocio.
 */
export interface GrupoTropas {
  id: string;
  empresaId: string;
  nombre: string | null;
  pesoBrutoTotal: number;
  pesoNetoTotal: number;
  cerrado: boolean;
  fechaCierre: string | null;
  pesoFinalVentaTotal: number | null;
  rinde: number | null;
  alertaSuperavit: boolean;
  comentarios: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GrupoTropasConMiembros extends GrupoTropas {
  compras: Compra[];
}

export interface CrearGrupoTropasInput {
  compraIds: string[];
  pesoBrutoTotal: number;
  nombre?: string;
  comentarios?: string;
}
