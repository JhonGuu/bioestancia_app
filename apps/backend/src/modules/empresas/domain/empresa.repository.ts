import { Empresa, Rubro } from "@/modules/empresas/domain/empresa";

/**
 * Interface del repositorio de Empresas. Forma parte del DOMINIO.
 * La implementación concreta (Drizzle) vive en infra/repository/.
 */
export interface EmpresaRepository {
  getById(id: string): Promise<Empresa | null>;

  /** Lista todas las empresas activas. Uso interno/administrativo. */
  list(): Promise<Empresa[]>;

  create(input: CreateEmpresaInput): Promise<Empresa>;
}

export interface CreateEmpresaInput {
  razonSocial: string;
  cuit?: string | null;
  rubro: Rubro;
}
