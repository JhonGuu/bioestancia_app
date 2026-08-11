import type { Rubro } from "@/modules/auth/domain/auth.types";

/** Espejo de `apps/backend/src/modules/empresas/domain/empresa.ts`. */
export interface Empresa {
  id: string;
  razonSocial: string;
  cuit: string | null;
  telefono: string | null;
  direccion: string | null;
  rubro: Rubro;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}
