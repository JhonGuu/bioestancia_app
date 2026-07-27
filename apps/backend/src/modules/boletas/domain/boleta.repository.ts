import { Boleta } from "@/modules/boletas/domain/boleta";

/**
 * Interface del repositorio de Boletas. Forma parte del DOMINIO.
 *
 * `empresaId` obligatorio en `getById`/`list` — mismo patrón que el resto de
 * los repositorios: nunca se lee sin saber de qué empresa.
 */
export interface BoletaRepository {
  getById(id: string, empresaId: string): Promise<Boleta | null>;

  /** Lista las boletas de una empresa puntual. */
  list(empresaId: string): Promise<Boleta[]>;

  create(input: CreateBoletaInput): Promise<Boleta>;
}

export interface CreateBoletaInput {
  empresaId: string;
  clienteId: string;
  fecha: Date;
  numero?: string;
  comentarios?: string;
}
