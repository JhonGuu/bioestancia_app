/** Espejo de `apps/backend/src/modules/personal/domain/cargo.ts`. */
export interface Cargo {
  id: string;
  empresaId: string;
  nombre: string;
  toleranciaMinutos: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
