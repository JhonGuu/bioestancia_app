/** Espejo de `apps/backend/src/modules/contabilidad/domain/centro-costo.ts`. */
export interface CentroCosto {
  id: string;
  empresaId: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
