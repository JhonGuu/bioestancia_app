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

  /**
   * Lista las boletas de una empresa en un rango de fechas — la usa el
   * reporte diario (`ObtenerReporteDiarioData`). `desde` inclusive, `hasta`
   * exclusive (medio-abierto), para no depender de que las fechas guardadas
   * sean exactamente medianoche.
   */
  listByRango(empresaId: string, desde: Date, hasta: Date): Promise<Boleta[]>;

  create(input: CreateBoletaInput): Promise<Boleta>;
}

export interface CreateBoletaInput {
  empresaId: string;
  clienteId: string;
  fecha: Date;
  numero?: string;
  comentarios?: string;
}
