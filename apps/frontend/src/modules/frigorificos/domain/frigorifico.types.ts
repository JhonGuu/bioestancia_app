/** Espejo de `apps/backend/src/modules/frigorificos/domain/frigorifico.ts`. */
export interface Frigorifico {
  id: string;
  empresaId: string;
  nombre: string;
  cuit: string | null;
  senasaNumero: string | null;
  rucaNumero: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}
