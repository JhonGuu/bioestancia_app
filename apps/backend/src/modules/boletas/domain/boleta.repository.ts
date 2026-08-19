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

  /** Lista TODAS las boletas de un cliente puntual (sin límite de fecha) — la usa `modules/cuenta-corriente`. */
  listByCliente(clienteId: string, empresaId: string): Promise<Boleta[]>;

  create(input: CreateBoletaInput): Promise<Boleta>;

  /**
   * Corrige fecha/número/comentarios de una boleta ya cargada — pensado para
   * arreglar una carga mal hecha (ver `use-cases/update-boleta.use-case.ts`).
   * `fechaVencimiento` se recalcula en el use-case si `fecha` cambia.
   */
  update(id: string, empresaId: string, input: UpdateBoletaInput): Promise<Boleta>;

  /**
   * Soft-delete: marca `activo=false`, no borra la fila (mismo criterio que
   * `ClienteRepository.delete`) — las `ventas` de esta boleta se desactivan
   * aparte (ver `use-cases/delete-boleta.use-case.ts`). Tira NOT_FOUND si no
   * existe (o no es de esta empresa).
   */
  delete(id: string, empresaId: string): Promise<void>;
}

export interface CreateBoletaInput {
  empresaId: string;
  clienteId: string;
  fecha: Date;
  /** Calculado por el use-case (`CreateBoleta`) antes de llamar al repositorio — ver `Boleta.fechaVencimiento`. */
  fechaVencimiento: Date;
  numero?: string;
  comentarios?: string;
}

export interface UpdateBoletaInput {
  fecha?: Date;
  fechaVencimiento?: Date | null;
  numero?: string | null;
  comentarios?: string | null;
}
