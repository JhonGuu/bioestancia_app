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

  /** Actualiza los datos de contacto/fiscales de una empresa (ver `UpdateEmpresa`). */
  update(id: string, input: UpdateEmpresaInput): Promise<Empresa>;
}

export interface CreateEmpresaInput {
  razonSocial: string;
  cuit?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  rubro: Rubro;
}

export interface UpdateEmpresaInput {
  cuit?: string | null;
  telefono?: string | null;
  direccion?: string | null;
}
